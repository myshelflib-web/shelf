/**
 * Pages generated at once inside a single job. Two in-flight 105B drafts
 * is about as far as a 512MB Render box can go; the vector worker already
 * skips ticks while a job is claimed. A second job is still forbidden.
 */
export const CONTENT_GEN_CONCURRENCY_MAX = 3;

export function contentGenConcurrency(): number {
  const raw = Number(process.env.CONTENT_GEN_CONCURRENCY);
  const n = Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 2;
  return Math.min(CONTENT_GEN_CONCURRENCY_MAX, Math.max(1, n));
}
