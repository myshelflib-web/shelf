import { isTransientError, withRetry, type RetryOptions } from "./retry.js";
import { metrics } from "./metrics.js";

const TRANSIENT_PRISMA_CODES = new Set([
  "P1001", // Can't reach database server
  "P1002", // Database server timed out
  "P1008", // Operations timed out
  "P1017", // Server closed the connection
  "P2024", // Timed out fetching a new connection from the pool
]);

export function isTransientDbError(err: unknown): boolean {
  if (err && typeof err === "object" && "code" in err) {
    const code = String((err as { code: string }).code);
    if (TRANSIENT_PRISMA_CODES.has(code)) return true;
  }
  return isTransientError(err);
}

/** Retry Prisma / Postgres transient connection and pool errors. */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const label = options.label ?? "db";

  return withRetry(fn, {
    attempts: options.attempts ?? 4,
    delayMs: options.delayMs ?? 200,
    maxDelayMs: options.maxDelayMs ?? 5000,
    factor: options.factor ?? 2,
    jitter: options.jitter ?? true,
    label,
    shouldRetry: (err, attempt) => {
      if (options.shouldRetry && !options.shouldRetry(err, attempt)) {
        return false;
      }
      return isTransientDbError(err);
    },
    onRetry: (err, attempt, delayMs) => {
      metrics.inc("db_retries_total", { label });
      options.onRetry?.(err, attempt, delayMs);
    },
  });
}
