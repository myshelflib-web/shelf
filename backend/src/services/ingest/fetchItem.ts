import prisma from "../../utils/prisma.js";
import { logger } from "../../utils/logger.js";
import { publishIngestMessage } from "./sqsPublisher.js";
import { createIngestJob } from "./ingestJobs.js";
import { downloadOfficialPdf } from "./officialPdfDownload.js";
import { compressAndUploadToS3 } from "../../utils/s3ObjectCompress.js";
import { adminDocPrefix, sourcePdfKey } from "../../utils/docPaths.js";
import { slugify } from "../../utils/slugify.js";
import { pdfContentHash } from "./contentHash.js";
import { deleteAdminArticleStorage } from "../preloaded/adminArticleStorage.js";

async function queueProcessPhase(itemId: string, sourceId: string): Promise<void> {
  const job = await createIngestJob({ phase: "PROCESS", sourceId, itemId });
  await publishIngestMessage({
    phase: "PROCESS",
    sourceId,
    itemId,
    jobId: job.id,
  });
}

export async function fetchIngestItem(itemId: string): Promise<{ ok: true; stored: boolean }> {
  const item = await prisma.ingestItem.findUnique({
    where: { id: itemId },
    include: { source: true },
  });
  if (!item) throw new Error("Ingest item not found.");

  if (item.license !== "OFFICIAL_DOCUMENT" || !item.sourcePdfUrl) {
    await prisma.ingestItem.update({
      where: { id: itemId },
      data: { status: "PENDING_REVIEW", fullDocumentStored: false },
    });
    await queueProcessPhase(itemId, item.sourceId);
    logger.info("ingest.fetch.link_only", { itemId, license: item.license });
    return { ok: true, stored: false };
  }

  const buffer = await downloadOfficialPdf(item.sourcePdfUrl);
  const hash = pdfContentHash(buffer);
  const subjectSlug = item.source.promoteToSubjectSlug ?? "official-documents";
  const topicSlug = item.source.promoteToTopicSlug ?? "updates";
  const articleSlug = slugify(`${item.title}-${item.edition ?? hash.slice(0, 8)}`);
  const prefix = adminDocPrefix(subjectSlug, topicSlug, articleSlug);
  const pdfKey = sourcePdfKey(prefix);

  if (item.pdfKey && item.pdfKey !== pdfKey) {
    await deleteAdminArticleStorage({ pdfKey: item.pdfKey });
  }

  await compressAndUploadToS3(pdfKey, buffer, "application/pdf");

  await prisma.ingestItem.update({
    where: { id: itemId },
    data: {
      pdfKey,
      fullDocumentStored: true,
      status: "PENDING_REVIEW",
    },
  });

  await queueProcessPhase(itemId, item.sourceId);
  logger.info("ingest.fetch.ok", { itemId, pdfKey, bytes: buffer.length });
  return { ok: true, stored: true };
}
