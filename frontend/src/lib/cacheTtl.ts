/** Max age for offline / in-memory snapshot caches before they are treated as stale. */
export const OFFLINE_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export function isCacheFresh(cachedAt: number | null | undefined): boolean {
  if (cachedAt == null || !Number.isFinite(cachedAt)) return false;
  return Date.now() - cachedAt < OFFLINE_CACHE_TTL_MS;
}

export function cacheAgeMs(cachedAt: number | null | undefined): number | null {
  if (cachedAt == null || !Number.isFinite(cachedAt)) return null;
  return Date.now() - cachedAt;
}
