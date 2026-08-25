import prisma from "../utils/prisma.js";
import { deleteVectorsForPage } from "./vectorStore.js";
import { logger } from "../utils/logger.js";

/** How many chunks can be indexed after releasing this page's previous index. */
export function chunkHeadroom(params: {
  limit: number;
  usedTotal: number;
  previousPageChunks: number;
}): number {
  const { limit, usedTotal, previousPageChunks } = params;
  return Math.max(0, limit - (usedTotal - previousPageChunks));
}

/** Chunks to keep after applying per-user limit (may truncate requested count). */
export function allowedChunkCount(params: {
  limit: number;
  usedTotal: number;
  previousPageChunks: number;
  requestedChunks: number;
}): number {
  const headroom = chunkHeadroom(params);
  return Math.min(params.requestedChunks, headroom);
}

/** Minimum LRU chunks to evict before indexing (0 if headroom is already enough). */
export function chunksToEvict(params: {
  limit: number;
  usedTotal: number;
  previousPageChunks: number;
  requestedChunks: number;
}): number {
  const headroom = chunkHeadroom(params);
  return Math.max(0, params.requestedChunks - headroom);
}

export async function removePageFromIndex(
  pageId: string,
  userId: string,
  chunkCount: number
): Promise<void> {
  await deleteVectorsForPage(pageId);
  await prisma.$transaction([
    prisma.pageVectorIndex.deleteMany({ where: { pageId } }),
    prisma.user.update({
      where: { id: userId },
      data: { vectorChunksUsed: { decrement: chunkCount } },
    }),
  ]);
}

/** Evict least-recently-indexed pages until at least minFreeChunks are available. */
export async function evictLruUntilRoom(
  userId: string,
  excludePageId: string,
  minFreeChunks: number,
  currentUsed: number,
  limit: number,
  previousPageChunks: number
): Promise<number> {
  if (minFreeChunks <= 0) return 0;

  let freed = 0;
  let used = currentUsed;

  while (freed < minFreeChunks) {
    const headroom = chunkHeadroom({
      limit,
      usedTotal: used,
      previousPageChunks,
    });
    if (headroom >= minFreeChunks) break;

    const victim = await prisma.pageVectorIndex.findFirst({
      where: { userId, pageId: { not: excludePageId } },
      orderBy: { indexedAt: "asc" },
    });
    if (!victim) break;

    await removePageFromIndex(victim.pageId, userId, victim.chunkCount);
    used -= victim.chunkCount;
    freed += victim.chunkCount;
    logger.info("vector.evicted", {
      userId,
      evictedPageId: victim.pageId,
      chunks: victim.chunkCount,
    });
  }

  return freed;
}
