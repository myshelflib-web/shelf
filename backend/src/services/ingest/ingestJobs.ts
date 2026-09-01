import type { IngestJobPhase, Prisma } from "@prisma/client";
import prisma from "../../utils/prisma.js";

export async function createIngestJob(input: {
  phase: IngestJobPhase;
  sourceId?: string;
  itemId?: string;
  payload?: Prisma.InputJsonValue;
}): Promise<{ id: string }> {
  const job = await prisma.ingestJob.create({
    data: {
      phase: input.phase,
      sourceId: input.sourceId,
      itemId: input.itemId,
      payload: input.payload,
      status: "QUEUED",
    },
    select: { id: true },
  });
  return job;
}

export async function markJobRunning(jobId: string): Promise<void> {
  await prisma.ingestJob.update({
    where: { id: jobId },
    data: { status: "RUNNING", startedAt: new Date(), attempts: { increment: 1 } },
  });
}

export async function markJobCompleted(jobId: string, sqsMessageId?: string | null): Promise<void> {
  await prisma.ingestJob.update({
    where: { id: jobId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      sqsMessageId: sqsMessageId ?? undefined,
      error: null,
    },
  });
}

export async function markJobFailed(jobId: string, error: string): Promise<void> {
  await prisma.ingestJob.update({
    where: { id: jobId },
    data: {
      status: "FAILED",
      completedAt: new Date(),
      error: error.slice(0, 2000),
    },
  });
}
