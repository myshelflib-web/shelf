/** Shared exponential backoff for background sync retries. */

/** Max background attempts after the first failure (uploads + mutations). */
export const MAX_SYNC_RETRY_ATTEMPTS = 10;

export function syncBackoffMs(attempts: number): number {
  const steps = [2_000, 5_000, 15_000, 30_000, 60_000, 120_000];
  return steps[Math.min(Math.max(attempts, 0), steps.length - 1)]!;
}

export function isSyncRetryExhausted(attempts: number): boolean {
  return attempts >= MAX_SYNC_RETRY_ATTEMPTS;
}

/** Far-future nextAttemptAt so exhausted jobs are never due for auto-flush. */
export const SYNC_RETRY_EXHAUSTED_AT = Number.MAX_SAFE_INTEGER;

export function syncRetryExhaustedMessage(kind: "upload" | "sync"): string {
  return kind === "upload"
    ? `Upload stopped after ${MAX_SYNC_RETRY_ATTEMPTS} tries`
    : `Sync stopped after ${MAX_SYNC_RETRY_ATTEMPTS} tries`;
}
