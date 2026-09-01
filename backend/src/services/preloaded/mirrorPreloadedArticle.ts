import prisma from "../../utils/prisma.js";
import { logger } from "../../utils/logger.js";
import { adminDocPrefix, sourcePdfKey } from "../../utils/docPaths.js";
import { compressAndUploadToS3 } from "../../utils/s3ObjectCompress.js";
import { downloadOfficialPdf } from "../ingest/officialPdfDownload.js";
import { deleteAdminArticleStorage } from "./adminArticleStorage.js";
import { shouldMirrorPreloadedArticle } from "./mirrorPolicy.js";
import { isIngestSqsConfigured } from "../ingest/sqsPublisher.js";

export async function mirrorPreloadedArticle(articleId: string): Promise<{
  mirrored: boolean;
  pdfKey?: string;
  reason?: string;
}> {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      topic: {
        select: {
          slug: true,
          subject: { select: { slug: true } },
        },
      },
    },
  });
  if (!article) throw new Error("Article not found.");

  if (
    !shouldMirrorPreloadedArticle({
      sourceLicense: article.sourceLicense,
      pdfKey: article.pdfKey,
      sourceUrl: article.sourceUrl,
      linkStatus: article.linkStatus,
      embeddable: article.embeddable,
    })
  ) {
    return { mirrored: false, reason: "not_eligible" };
  }

  const url = article.sourceUrl!.trim();
  const buffer = await downloadOfficialPdf(url);
  const prefix = adminDocPrefix(
    article.topic.subject.slug,
    article.topic.slug,
    article.slug
  );
  const pdfKey = sourcePdfKey(prefix);

  if (article.pdfKey && article.pdfKey !== pdfKey) {
    await deleteAdminArticleStorage({
      pdfKey: article.pdfKey,
      contentUrl: article.contentUrl,
    });
  }

  await compressAndUploadToS3(pdfKey, buffer, "application/pdf");

  await prisma.article.update({
    where: { id: articleId },
    data: {
      pdfKey,
      status: "PROCESSING",
      contentUrl: null,
    },
  });

  logger.info("preloaded.mirror.ok", {
    articleId,
    pdfKey,
    bytes: buffer.length,
    sourceUrl: url,
  });
  return { mirrored: true, pdfKey };
}

export async function loadPreloadedMirrorCandidates(opts?: {
  limit?: number;
}): Promise<Array<{ id: string }>> {
  const limit = Math.min(50, Math.max(1, opts?.limit ?? Number(process.env.PRELOADED_MIRROR_BATCH ?? 10)));

  const rows = await prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      sourceLicense: "OFFICIAL_DOCUMENT",
      pdfKey: null,
      linkStatus: "OK",
      sourceUrl: { not: null },
    },
    orderBy: [{ lastLinkCheckAt: "desc" }, { updatedAt: "desc" }],
    take: limit * 3,
    select: {
      id: true,
      sourceUrl: true,
      embeddable: true,
      linkStatus: true,
      sourceLicense: true,
      pdfKey: true,
    },
  });

  const eligible = rows.filter((row) =>
    shouldMirrorPreloadedArticle({
      sourceLicense: row.sourceLicense,
      pdfKey: row.pdfKey,
      sourceUrl: row.sourceUrl,
      linkStatus: row.linkStatus,
      embeddable: row.embeddable,
    })
  );

  return eligible.slice(0, limit).map((row) => ({ id: row.id }));
}

export async function runPreloadedMirrorBatch(
  limit = Number(process.env.PRELOADED_MIRROR_BATCH ?? 10)
): Promise<number> {
  const { enqueuePreloadedMirror } = await import("./preloadedMirrorQueue.js");
  const candidates = await loadPreloadedMirrorCandidates({ limit });
  let queued = 0;

  for (const row of candidates) {
    try {
      const id = await enqueuePreloadedMirror(row.id);
      if (id) queued += 1;
    } catch (err) {
      logger.warn("preloaded.mirror.enqueue_failed", {
        articleId: row.id,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (queued > 0) {
    logger.info("preloaded.mirror.batch", { queued, candidates: candidates.length });
  }
  return queued;
}

export async function maybeEnqueuePreloadedMirror(articleId: string): Promise<void> {
  if (process.env.PRELOADED_MIRROR_PDF !== "true") return;

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: {
      sourceLicense: true,
      pdfKey: true,
      sourceUrl: true,
      linkStatus: true,
      embeddable: true,
    },
  });
  if (!article) return;
  if (
    !shouldMirrorPreloadedArticle({
      sourceLicense: article.sourceLicense,
      pdfKey: article.pdfKey,
      sourceUrl: article.sourceUrl,
      linkStatus: article.linkStatus,
      embeddable: article.embeddable,
    })
  ) {
    return;
  }

  const { enqueuePreloadedMirror } = await import("./preloadedMirrorQueue.js");
  const messageId = await enqueuePreloadedMirror(articleId);
  if (messageId === null && !isIngestSqsConfigured()) {
    await mirrorPreloadedArticle(articleId);
  }
}
