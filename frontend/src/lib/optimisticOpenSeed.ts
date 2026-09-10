import type { UserContentType } from "@/types";

export type OptimisticOpenSeed = {
  pageId: string;
  href: string;
  contentType: UserContentType;
  title?: string;
  /** Doc/sketch/video notes HTML when known client-side. */
  content?: string;
  /** Link / YouTube watch URL. */
  sourceUrl?: string;
};

const byHref = new Map<string, OptimisticOpenSeed>();
const byPageId = new Map<string, OptimisticOpenSeed>();

/** Stash seed for the next DocumentPane open (not persisted to localStorage). */
export function setOptimisticOpenSeed(seed: OptimisticOpenSeed): void {
  if (!seed.pageId || !seed.href || !seed.contentType) return;
  byHref.set(seed.href, seed);
  byPageId.set(seed.pageId, seed);
}

export function peekOptimisticOpenSeed(input: {
  href?: string | null;
  pageId?: string | null;
}): OptimisticOpenSeed | null {
  if (input.pageId) {
    const hit = byPageId.get(input.pageId);
    if (hit) return hit;
  }
  if (input.href) {
    const hit = byHref.get(input.href);
    if (hit) return hit;
  }
  return null;
}

/** Consume seed once the optimistic shell has been applied. */
export function takeOptimisticOpenSeed(input: {
  href?: string | null;
  pageId?: string | null;
}): OptimisticOpenSeed | null {
  const seed = peekOptimisticOpenSeed(input);
  if (!seed) return null;
  byHref.delete(seed.href);
  byPageId.delete(seed.pageId);
  return seed;
}

export function clearOptimisticOpenSeeds(): void {
  byHref.clear();
  byPageId.clear();
}
