import "dotenv/config";
import { processPdf } from "./processor.js";
import { errorFields, logger } from "./utils/logger.js";
import { metrics } from "./utils/metrics.js";
import { withRetry } from "./utils/retry.js";

export interface ProcessingJob {
  type: "admin" | "user";
  topicId: string;
  pdfKey: string;
  subjectSlug: string;
  topicSlug: string;
  articleSlug?: string;
  userId?: string;
}

const inFlight = new Set<string>();

function internalHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (process.env.INTERNAL_SECRET) {
    headers["x-internal-secret"] = process.env.INTERNAL_SECRET;
  }
  return headers;
}

async function fetchPendingJobs(): Promise<ProcessingJob[]> {
  return withRetry(
    async () => {
      const response = await fetch(
        `${process.env.BACKEND_URL}/api/internal/pending-processing`,
        { headers: internalHeaders() }
      );

      if (!response.ok) {
        const err = new Error(
          `Failed to fetch pending jobs: ${response.status}`
        ) as Error & { status?: number };
        err.status = response.status;
        throw err;
      }

      const data = (await response.json()) as { jobs: ProcessingJob[] };
      return data.jobs ?? [];
    },
    {
      label: "fetch.pending_jobs",
      attempts: 4,
      delayMs: 300,
      onRetry: () => metrics.inc("worker_retries_total", { op: "fetch_jobs" }),
    }
  );
}

async function notifyProcessed(
  job: ProcessingJob,
  payload: { contentUrl?: string; status: string }
): Promise<void> {
  const callbackPath =
    job.type === "user"
      ? `/api/internal/user-topics/${job.topicId}/processed`
      : `/api/internal/topics/${job.topicId}/processed`;

  await withRetry(
    async () => {
      const response = await fetch(`${process.env.BACKEND_URL}${callbackPath}`, {
        method: "POST",
        headers: internalHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = new Error(
          `Callback failed: ${response.status}`
        ) as Error & { status?: number };
        err.status = response.status;
        throw err;
      }
    },
    {
      label: "notify.processed",
      attempts: 4,
      delayMs: 300,
      onRetry: () =>
        metrics.inc("worker_retries_total", { op: "notify_processed" }),
    }
  );
}

export async function runJob(job: ProcessingJob): Promise<void> {
  if (inFlight.has(job.topicId)) {
    logger.debug("worker.job.skipped_in_flight", {
      topicId: job.topicId,
      type: job.type,
    });
    return;
  }

  inFlight.add(job.topicId);
  const log = logger.child({
    jobId: job.topicId,
    type: job.type,
    pdfKey: job.pdfKey,
    subjectSlug: job.subjectSlug,
    topicSlug: job.topicSlug,
    articleSlug: job.articleSlug,
  });
  const start = Date.now();

  log.info("worker.job.start");
  metrics.inc("worker_jobs_started_total", { type: job.type });

  try {
    const { contentKey } = await processPdf({
      topicId: job.topicId,
      pdfKey: job.pdfKey,
      subjectSlug: job.subjectSlug,
      topicSlug: job.topicSlug,
      userId: job.userId,
      type: job.type,
    });

    await notifyProcessed(job, { contentUrl: contentKey, status: "PUBLISHED" });

    const durationMs = Date.now() - start;
    metrics.inc("worker_jobs_total", { type: job.type, status: "PUBLISHED" });
    metrics.observe("worker_job_duration_ms", durationMs, {
      type: job.type,
      status: "PUBLISHED",
    });
    log.info("worker.job.ok", { contentKey, durationMs });
  } catch (err) {
    const durationMs = Date.now() - start;
    metrics.inc("worker_jobs_total", { type: job.type, status: "FAILED" });
    metrics.observe("worker_job_duration_ms", durationMs, {
      type: job.type,
      status: "FAILED",
    });
    log.error("worker.job.failed", { durationMs, ...errorFields(err) });

    try {
      await notifyProcessed(job, { status: "FAILED" });
    } catch (notifyErr) {
      metrics.inc("worker_callback_failures_total", { type: job.type });
      log.error("worker.job.failed_callback", errorFields(notifyErr));
    }
  } finally {
    inFlight.delete(job.topicId);
  }
}

export async function pollAndProcess(): Promise<void> {
  const pollStart = Date.now();
  metrics.inc("worker_polls_total");

  try {
    const jobs = await fetchPendingJobs();
    metrics.observe("worker_poll_duration_ms", Date.now() - pollStart, {
      ok: true,
    });
    logger.debug("worker.poll", {
      jobCount: jobs.length,
      inFlight: inFlight.size,
      durationMs: Date.now() - pollStart,
    });

    for (const job of jobs) {
      await runJob(job);
    }
  } catch (err) {
    metrics.observe("worker_poll_duration_ms", Date.now() - pollStart, {
      ok: false,
    });
    metrics.inc("worker_poll_failures_total");
    logger.error("worker.poll.failed", errorFields(err));
    throw err;
  }
}

export function startWorker(): void {
  const intervalMs = Number(process.env.POLL_INTERVAL_MS ?? 15000);

  logger.info("worker.started", { pollIntervalMs: intervalMs });

  pollAndProcess().catch((err) =>
    logger.error("worker.initial_poll.failed", errorFields(err))
  );

  setInterval(() => {
    pollAndProcess().catch((err) =>
      logger.error("worker.poll.failed", errorFields(err))
    );
  }, intervalMs);
}

export function getInFlightCount(): number {
  return inFlight.size;
}
