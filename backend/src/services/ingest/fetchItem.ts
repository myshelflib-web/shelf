import prisma from "../../utils/prisma.js";
import { logger } from "../../utils/logger.js";
import { publishIngestMessage } from "./sqsPublisher.js";
import { createIngestJob } from "./ingestJobs.js";

export async function fetchIngestItem(itemId: string): Promise<{ ok: true }> {
  const item = await prisma.ingestItem.findUnique({
    where: { id: itemId },
    include: { source: true },
  });
  if (!item) throw new Error("Ingest item not found.");

  const nextStatus =
    item.license === "OFFICIAL_DOCUMENT" && item.sourcePdfUrl
      ? "PENDING_REVIEW"
      : "PENDING_REVIEW";

  await prisma.ingestItem.update({
    where: { id: itemId },
    data: {
      status: nextStatus,
      fullDocumentStored: false,
      pdfKey: null,
    },
  });

  const job = await createIngestJob({ phase: "PROCESS", sourceId: item.sourceId, itemId });
  await publishIngestMessage({
    phase: "PROCESS",
    sourceId: item.sourceId,
    itemId,
    jobId: job.id,
  });

  logger.info("ingest.fetch.link_only", {
    itemId,
    license: item.license,
    skippedAdminStorage: true,
  });
  return { ok: true };
}
