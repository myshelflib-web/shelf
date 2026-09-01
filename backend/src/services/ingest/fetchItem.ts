import prisma from "../../utils/prisma.js";
import { logger } from "../../utils/logger.js";
import { pdfContentHash } from "./contentHash.js";
import { publishIngestMessage } from "./sqsPublisher.js";
import { createIngestJob } from "./ingestJobs.js";
import { parsePublicHttpUrl } from "../../utils/publicUrl.js";
import { fetchWithRetry } from "../../utils/fetchRetry.js";
import { compressAndUploadToS3 } from "../../utils/s3ObjectCompress.js";
import { adminDocPrefix, sourcePdfKey } from "../../utils/docPaths.js";
import { slugify } from "../../utils/slugify.js";
import { ingestFetchHeaders } from "./ingestHttp.js";

const MAX_PDF_BYTES = 50 * 1024 * 1024;

export async function fetchIngestItem(itemId: string): Promise<{ ok: true }> {
  const item = await prisma.ingestItem.findUnique({
    where: { id: itemId },
    include: { source: true },
  });
  if (!item) throw new Error("Ingest item not found.");

  if (item.license !== "OFFICIAL_DOCUMENT" || !item.sourcePdfUrl) {
    await prisma.ingestItem.update({
      where: { id: itemId },
      data: { status: "PENDING_REVIEW" },
    });
    const job = await createIngestJob({ phase: "PROCESS", sourceId: item.sourceId, itemId });
    await publishIngestMessage({
      phase: "PROCESS",
      sourceId: item.sourceId,
      itemId,
      jobId: job.id,
    });
    return { ok: true };
  }

  const safe = parsePublicHttpUrl(item.sourcePdfUrl);
  if (!safe) throw new Error("PDF URL is not allowed.");

  const res = await fetchWithRetry(safe, {
    timeoutMs: 120_000,
    redirect: "follow",
    headers: ingestFetchHeaders({ Accept: "application/pdf, */*" }),
  });
  if (!res.ok) throw new Error(`PDF download failed (${res.status}).`);

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_PDF_BYTES) {
    throw new Error("PDF exceeds ingest size limit.");
  }
  if (buffer.length < 512) throw new Error("PDF appears empty or invalid.");

  const hash = pdfContentHash(buffer);
  const subjectSlug = item.source.promoteToSubjectSlug ?? "official-documents";
  const topicSlug = item.source.promoteToTopicSlug ?? "updates";
  const articleSlug = slugify(`${item.title}-${item.edition ?? hash.slice(0, 8)}`);
  const prefix = adminDocPrefix(subjectSlug, topicSlug, articleSlug);
  const pdfKey = sourcePdfKey(prefix);

  await compressAndUploadToS3(pdfKey, buffer, "application/pdf");

  await prisma.ingestItem.update({
    where: { id: itemId },
    data: {
      pdfKey,
      fullDocumentStored: true,
      status: "PENDING_REVIEW",
    },
  });

  const job = await createIngestJob({ phase: "PROCESS", sourceId: item.sourceId, itemId });
  await publishIngestMessage({
    phase: "PROCESS",
    sourceId: item.sourceId,
    itemId,
    jobId: job.id,
  });

  logger.info("ingest.fetch.ok", { itemId, pdfKey, bytes: buffer.length });
  return { ok: true };
}
