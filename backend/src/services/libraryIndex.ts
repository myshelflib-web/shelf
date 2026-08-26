import { createHash } from "crypto";
import prisma from "../utils/prisma.js";
import { contentKeyFromPdfKey, pageHref } from "../utils/docPaths.js";
import { getFromS3 } from "./s3.js";
import { htmlToPlainText } from "../utils/htmlText.js";
import { chunkText } from "../utils/chunkText.js";
import { labeledChunk } from "../utils/embedLabel.js";
import { logger, errorFields } from "../utils/logger.js";
import { MAX_CHUNKS_PER_PAGE, vectorChunkLimit } from "../utils/quotas.js";
import { embedTexts } from "./embeddings.js";
import {
  allowedChunkCount,
  chunksToEvict,
  evictLruUntilRoom,
  removePageFromIndex,
} from "./vectorEviction.js";
import {
  chunkPointId,
  deleteVectorsForPage,
  isVectorConfigured,
  upsertVectors,
} from "./vectorStore.js";

function hashContent(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

/** Plain text for indexing / Study AI (HTML, derived PDF content.html, or link meta). */
export async function extractPageBody(page: {
  title: string;
  contentType: string;
  contentUrl: string | null;
  sourceUrl: string | null;
  pdfKey: string | null;
}): Promise<string> {
  if (page.contentType === "LINK" && page.sourceUrl) {
    return `${page.title}\n${page.sourceUrl}`;
  }

  const htmlKeys: string[] = [];
  if (
    page.contentUrl &&
    (page.contentType !== "PDF" ||
      page.contentUrl.includes("content.html") ||
      page.contentUrl.endsWith(".html"))
  ) {
    htmlKeys.push(page.contentUrl);
  }
  if (page.pdfKey) {
    const derived = contentKeyFromPdfKey(page.pdfKey);
    if (!htmlKeys.includes(derived)) htmlKeys.push(derived);
  }

  for (const key of htmlKeys) {
    try {
      const html = await getFromS3(key);
      const text = htmlToPlainText(html);
      if (text) return text;
    } catch (err) {
      logger.debug("library_index.fetch_miss", {
        key,
        ...errorFields(err),
      });
    }
  }

  return page.title;
}

export function scheduleIndexPage(pageId: string) {
  if (!isVectorConfigured()) return;
  void indexUserPage(pageId).catch((err) => {
    logger.error("library_index.failed", { pageId, ...errorFields(err) });
  });
}

export function scheduleDeletePageVectors(pageId: string) {
  if (!isVectorConfigured()) return;
  void purgePageVectors(pageId).catch((err) => {
    logger.error("library_index.delete_failed", { pageId, ...errorFields(err) });
  });
}

export async function purgePageVectors(pageId: string): Promise<void> {
  if (!isVectorConfigured()) return;

  const row = await prisma.pageVectorIndex.findUnique({ where: { pageId } });
  if (row) {
    await removePageFromIndex(pageId, row.userId, row.chunkCount);
    return;
  }
  await deleteVectorsForPage(pageId);
}

export async function indexUserPage(pageId: string): Promise<void> {
  if (!isVectorConfigured()) return;

  const page = await prisma.userTopic.findUnique({
    where: { id: pageId },
    include: {
      userSubject: { select: { name: true, slug: true } },
      userTopicGroup: { select: { title: true, slug: true } },
    },
  });
  if (!page || page.status !== "PUBLISHED") return;

  const body = await extractPageBody(page);
  const contentHash = hashContent(`v2:${body}`);

  const existing = await prisma.pageVectorIndex.findUnique({ where: { pageId } });
  if (existing?.contentHash === contentHash) {
    // Keep worker queue moving when page.updatedAt was bumped without content changes.
    await prisma.pageVectorIndex.update({
      where: { pageId },
      data: { updatedAt: new Date() },
    });
    logger.info("library_index.unchanged", { pageId });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: page.userId },
    select: {
      id: true,
      plan: true,
      role: true,
      subscriptionExpiresAt: true,
      vectorChunksUsed: true,
    },
  });
  if (!user) return;

  const requestedChunks = chunkText(body).slice(0, MAX_CHUNKS_PER_PAGE);
  if (requestedChunks.length === 0) return;

  const previousCount = existing?.chunkCount ?? 0;
  const limit = vectorChunkLimit(user);
  let usedTotal = user.vectorChunksUsed;

  const needEvict = chunksToEvict({
    limit,
    usedTotal,
    previousPageChunks: previousCount,
    requestedChunks: requestedChunks.length,
  });
  if (needEvict > 0) {
    await evictLruUntilRoom(
      page.userId,
      pageId,
      needEvict,
      usedTotal,
      limit,
      previousCount
    );
    const refreshed = await prisma.user.findUnique({
      where: { id: page.userId },
      select: { vectorChunksUsed: true },
    });
    usedTotal = refreshed?.vectorChunksUsed ?? usedTotal;
  }

  const chunkCount = allowedChunkCount({
    limit,
    usedTotal,
    previousPageChunks: previousCount,
    requestedChunks: requestedChunks.length,
  });
  if (chunkCount === 0) {
    logger.warn("library_index.quota_full", { pageId, userId: page.userId });
    return;
  }

  const chunks = requestedChunks.slice(0, chunkCount);
  const href = pageHref(
    page.userSubject?.slug,
    page.userTopicGroup?.slug,
    page.slug
  );

  await deleteVectorsForPage(pageId);

  const notebook = page.userSubject?.name ?? "Library";
  const topic = page.userTopicGroup?.title ?? "";
  const labeled = chunks.map((text) =>
    labeledChunk({ title: page.title, notebook, topic }, text)
  );
  const vectors = await embedTexts(labeled, { task: "document" });
  await upsertVectors(
    chunks.map((text, i) => ({
      id: chunkPointId(pageId, i),
      vector: vectors[i],
      payload: {
        userId: page.userId,
        pageId: page.id,
        title: page.title,
        notebook,
        topic,
        href,
        text,
        chunkIndex: i,
      },
    }))
  );

  const nextUsed = usedTotal - previousCount + chunks.length;
  await prisma.$transaction([
    prisma.pageVectorIndex.upsert({
      where: { pageId },
      create: {
        pageId,
        userId: page.userId,
        chunkCount: chunks.length,
        contentHash,
      },
      update: {
        chunkCount: chunks.length,
        contentHash,
        indexedAt: new Date(),
      },
    }),
    prisma.user.update({
      where: { id: page.userId },
      data: { vectorChunksUsed: nextUsed },
    }),
  ]);

  logger.info("library_index.ok", {
    pageId,
    chunks: chunks.length,
    userId: page.userId,
    vectorChunksUsed: nextUsed,
  });
}
