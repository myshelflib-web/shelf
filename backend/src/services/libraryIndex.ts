import { createHash } from "crypto";
import prisma from "../utils/prisma.js";
import { pageHref } from "../utils/docPaths.js";
import { chunkText } from "../utils/chunkText.js";
import { labeledChunk } from "../utils/embedLabel.js";
import { logger, errorFields } from "../utils/logger.js";
import { MAX_CHUNKS_PER_PAGE, vectorChunkLimit } from "../utils/quotas.js";
import { embedTexts } from "./embeddings.js";
import { apiKeyRouteForUser } from "./apiKeyRoute.js";
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
import {
  INDEX_CONTENT_VERSION,
  INDEX_LEASE_PREFIX,
  assembleIndexText,
  extractPageBody,
} from "./libraryIndexText.js";

export { extractPageBody } from "./libraryIndexText.js";
export {
  INDEX_CONTENT_VERSION,
  INDEX_LEASE_PREFIX,
} from "./libraryIndexText.js";

/** Version-prefixed digest so the worker can refresh pre-v5 (metadata-only / no OCR) rows. */
function hashContent(text: string): string {
  const digest = createHash("sha256").update(text).digest("hex").slice(0, 16);
  return `${INDEX_CONTENT_VERSION}:${digest}`;
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
      highlights: {
        select: { text: true, note: true },
        orderBy: { createdAt: "asc" },
        take: 80,
      },
    },
  });
  if (!page || page.status !== "PUBLISHED") return;

  // Lease first so a killed process does not immediately retry this page.
  await prisma.pageVectorIndex.upsert({
    where: { pageId },
    create: {
      pageId,
      userId: page.userId,
      chunkCount: 0,
      contentHash: `${INDEX_LEASE_PREFIX}${Date.now()}`,
    },
    update: {
      contentHash: `${INDEX_LEASE_PREFIX}${Date.now()}`,
    },
  });

  const fileText = await extractPageBody(page, { ocr: true });

  const notebook = page.userSubject?.name ?? "Library";
  const topic = page.userTopicGroup?.title ?? "";
  const body = assembleIndexText({
    title: page.title,
    contentType: page.contentType,
    notebook,
    topic,
    sourceUrl: page.sourceUrl,
    fileText,
    highlights: page.highlights,
  });

  const contentHash = hashContent(body);

  const existing = await prisma.pageVectorIndex.findUnique({ where: { pageId } });
  if (existing?.contentHash === contentHash) {
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

  let requestedChunks = chunkText(body).slice(0, MAX_CHUNKS_PER_PAGE);
  if (requestedChunks.length === 0) {
    requestedChunks = [
      assembleIndexText({
        title: page.title || "Untitled",
        contentType: page.contentType,
        notebook,
        topic,
        sourceUrl: page.sourceUrl,
        fileText: "",
      }),
    ];
  }

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

  const labeled = chunks.map((text) =>
    labeledChunk({ title: page.title, notebook, topic }, text)
  );
  const vectors = await embedTexts(labeled, {
    task: "document",
    apiKeyRoute: apiKeyRouteForUser(user),
  });
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
