import { Prisma } from "@prisma/client";
import prisma from "../../utils/prisma.js";
import { errorFields, logger } from "../../utils/logger.js";

const ITEM_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
const BATCH = 20;

/**
 * Drops per-page rows (and any leftover plan JSON) on finished jobs older than
 * two weeks. The job header stays so cost history remains in the admin list.
 */
export async function pruneFinishedContentGenJobs(): Promise<void> {
  const cutoff = new Date(Date.now() - ITEM_RETENTION_MS);
  const stale = await prisma.contentGenJob.findMany({
    where: {
      status: { in: ["COMPLETED", "FAILED"] },
      finishedAt: { lt: cutoff },
    },
    select: { id: true },
    take: BATCH,
  });

  for (const job of stale) {
    await prisma.contentGenItem.deleteMany({ where: { jobId: job.id } });
    await prisma.contentGenJob.update({
      where: { id: job.id },
      data: { plan: Prisma.DbNull },
    });
  }
}

export function scheduleContentGenPrune(): void {
  void pruneFinishedContentGenJobs().catch((err) => {
    logger.warn("contentgen.prune.failed", errorFields(err));
  });
}
