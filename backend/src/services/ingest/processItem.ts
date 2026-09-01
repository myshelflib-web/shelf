import prisma from "../../utils/prisma.js";
import { logger } from "../../utils/logger.js";
import { publishIngestMessage } from "./sqsPublisher.js";
import { createIngestJob } from "./ingestJobs.js";
import { checkIngestItemLink } from "./linkHealth.js";

const AUTO_PUBLISH_LICENSES = new Set(["GOVERNMENT_PRESS"]);

export async function processIngestItem(itemId: string): Promise<{ status: string }> {
  const item = await prisma.ingestItem.findUnique({
    where: { id: itemId },
    include: { source: true },
  });
  if (!item) throw new Error("Ingest item not found.");

  if (item.status === "PUBLISHED" || item.status === "REJECTED" || item.status === "ARCHIVED") {
    return { status: item.status };
  }

  const nextStatus =
    item.status === "APPROVED"
      ? "APPROVED"
      : AUTO_PUBLISH_LICENSES.has(item.license)
        ? "APPROVED"
        : "PENDING_REVIEW";

  await prisma.ingestItem.update({
    where: { id: itemId },
    data: {
      status: nextStatus,
      reviewedAt: nextStatus === "APPROVED" ? new Date() : undefined,
    },
  });

  if (nextStatus === "APPROVED" && item.source.promoteToSubjectSlug && item.source.promoteToTopicSlug) {
    const job = await createIngestJob({ phase: "PROMOTE", sourceId: item.sourceId, itemId });
    await publishIngestMessage({
      phase: "PROMOTE",
      sourceId: item.sourceId,
      itemId,
      jobId: job.id,
    });
  }

  logger.info("ingest.process.ok", { itemId, nextStatus });

  if (nextStatus === "APPROVED" && !item.pdfKey && !item.fullDocumentStored) {
    void checkIngestItemLink(itemId).catch((err) =>
      logger.warn("ingest.link_check.process_hook_failed", {
        itemId,
        err: err instanceof Error ? err.message : String(err),
      })
    );
  }

  return { status: nextStatus };
}

export async function approveIngestItem(itemId: string): Promise<void> {
  const item = await prisma.ingestItem.findUnique({
    where: { id: itemId },
    select: { sourceId: true },
  });
  if (!item) throw new Error("Ingest item not found.");

  await prisma.ingestItem.update({
    where: { id: itemId },
    data: { status: "APPROVED", reviewedAt: new Date() },
  });
  const job = await createIngestJob({ phase: "PROMOTE", sourceId: item.sourceId, itemId });
  await publishIngestMessage({
    phase: "PROMOTE",
    sourceId: item.sourceId,
    itemId,
    jobId: job.id,
  });
}

export async function rejectIngestItem(itemId: string): Promise<void> {
  await prisma.ingestItem.update({
    where: { id: itemId },
    data: { status: "REJECTED", reviewedAt: new Date() },
  });
}

export async function bulkApproveIngestItems(opts: {
  ids?: string[];
  status?: "PENDING_REVIEW" | "FETCHED";
  limit?: number;
}): Promise<{ approved: number; failed: number; errors: string[] }> {
  const limit = Math.min(100, Math.max(1, opts.limit ?? 50));
  let ids = opts.ids?.filter(Boolean) ?? [];

  if (ids.length === 0) {
    const status = opts.status ?? "PENDING_REVIEW";
    const pending = await prisma.ingestItem.findMany({
      where: { status },
      orderBy: { fetchedAt: "asc" },
      take: limit,
      select: { id: true },
    });
    ids = pending.map((row) => row.id);
  }

  let approved = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const id of ids) {
    try {
      await approveIngestItem(id);
      approved += 1;
    } catch (err) {
      failed += 1;
      errors.push(
        `${id}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  logger.info("ingest.bulk_approve.ok", { approved, failed, requested: ids.length });
  return { approved, failed, errors };
}
