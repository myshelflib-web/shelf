import prisma from "../../utils/prisma.js";
import { logger } from "../../utils/logger.js";
import { CADENCE_MS } from "./sourceRegistry.js";
import { publishIngestMessage, isIngestSqsConfigured } from "./sqsPublisher.js";
import {
  createIngestJob,
  markJobCompleted,
  markJobFailed,
  markJobRunning,
} from "./ingestJobs.js";
import { pollIngestSource } from "./pollSource.js";
import { runLinkHealthBatch } from "./linkHealth.js";

export async function findSourcesDueForPoll(limit = 20): Promise<{ id: string; slug: string }[]> {
  const sources = await prisma.ingestSource.findMany({
    where: { enabled: true },
    select: { id: true, slug: true, cadence: true, lastPolledAt: true },
    orderBy: { lastPolledAt: "asc" },
    take: 50,
  });

  const now = Date.now();
  const due = sources.filter((s) => {
    if (!s.lastPolledAt) return true;
    return now - s.lastPolledAt.getTime() >= CADENCE_MS[s.cadence];
  });

  return due.slice(0, limit).map((s) => ({ id: s.id, slug: s.slug }));
}

export async function enqueueSourcePoll(sourceId: string): Promise<{ jobId: string; sqsMessageId: string | null }> {
  const job = await createIngestJob({ phase: "POLL", sourceId });

  if (!isIngestSqsConfigured()) {
    await markJobRunning(job.id);
    try {
      await pollIngestSource(sourceId);
      await markJobCompleted(job.id);
    } catch (err) {
      await markJobFailed(job.id, err instanceof Error ? err.message : String(err));
      throw err;
    }
    logger.info("ingest.poll.inline", { sourceId, jobId: job.id });
    return { jobId: job.id, sqsMessageId: null };
  }

  const sqsMessageId = await publishIngestMessage({
    phase: "POLL",
    sourceId,
    jobId: job.id,
  });
  if (sqsMessageId) {
    await prisma.ingestJob.update({
      where: { id: job.id },
      data: { sqsMessageId },
    });
  }
  logger.info("ingest.poll.enqueued", { sourceId, jobId: job.id, sqs: Boolean(sqsMessageId) });
  return { jobId: job.id, sqsMessageId };
}

export async function enqueueDueSourcePolls(): Promise<number> {
  const due = await findSourcesDueForPoll();
  for (const source of due) {
    await enqueueSourcePoll(source.id);
  }
  return due.length;
}

let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let linkHealthTimer: ReturnType<typeof setInterval> | null = null;

export function startLinkHealthScheduler(): void {
  if (process.env.INGEST_LINK_CHECK !== "true") return;
  const intervalMs = Number(process.env.INGEST_LINK_CHECK_INTERVAL_MS ?? 21_600_000);
  if (linkHealthTimer) return;

  logger.info("ingest.link_check.scheduler_started", { intervalMs });
  void runLinkHealthBatch().catch((err) =>
    logger.warn("ingest.link_check.initial_failed", { err: String(err) })
  );
  linkHealthTimer = setInterval(() => {
    void runLinkHealthBatch().catch((err) =>
      logger.warn("ingest.link_check.tick_failed", { err: String(err) })
    );
  }, intervalMs);
}

export function startIngestScheduler(): void {
  if (process.env.INGEST_SCHEDULER !== "true") return;
  const intervalMs = Number(process.env.INGEST_SCHEDULER_INTERVAL_MS ?? 300_000);
  if (schedulerTimer) return;

  logger.info("ingest.scheduler.started", { intervalMs });
  void enqueueDueSourcePolls().catch((err) =>
    logger.warn("ingest.scheduler.initial_failed", { err: String(err) })
  );
  schedulerTimer = setInterval(() => {
    void enqueueDueSourcePolls().catch((err) =>
      logger.warn("ingest.scheduler.tick_failed", { err: String(err) })
    );
  }, intervalMs);
}
