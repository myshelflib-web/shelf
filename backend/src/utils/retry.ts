import { errorFields, logger } from "./logger.js";

export interface RetryOptions {
  /** Max attempts including the first try. Default 3. */
  attempts?: number;
  /** Initial delay in ms. Default 200. */
  delayMs?: number;
  /** Max delay cap in ms. Default 5000. */
  maxDelayMs?: number;
  /** Multiplier per attempt. Default 2. */
  factor?: number;
  /** Add jitter to delay. Default true. */
  jitter?: boolean;
  /** Optional label for logs/metrics. */
  label?: string;
  /** Return false to stop retrying immediately. */
  shouldRetry?: (err: unknown, attempt: number) => boolean;
  onRetry?: (err: unknown, attempt: number, delayMs: number) => void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeDelay(
  attempt: number,
  delayMs: number,
  maxDelayMs: number,
  factor: number,
  jitter: boolean
): number {
  const exp = Math.min(maxDelayMs, delayMs * Math.pow(factor, attempt - 1));
  if (!jitter) return exp;
  const spread = exp * 0.2;
  return Math.max(0, Math.round(exp - spread + Math.random() * spread * 2));
}

/** Default: retry network / transient AWS / 5xx-style failures. */
export function isTransientError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as {
    name?: string;
    code?: string;
    statusCode?: number;
    $metadata?: { httpStatusCode?: number };
    message?: string;
  };

  const code = e.code ?? e.name ?? "";
  const status = e.statusCode ?? e.$metadata?.httpStatusCode;
  const message = (e.message ?? "").toLowerCase();

  if (
    [
      "TimeoutError",
      "AbortError",
      "NetworkingError",
      "ECONNRESET",
      "ECONNREFUSED",
      "ETIMEDOUT",
      "ENOTFOUND",
      "EAI_AGAIN",
      "Throttling",
      "ThrottlingException",
      "SlowDown",
      "RequestTimeout",
      "ServiceUnavailable",
      "InternalError",
      "PriorRequestNotComplete",
    ].some((c) => code.includes(c) || message.includes(c.toLowerCase()))
  ) {
    return true;
  }

  if (/timed out|rate limited|quota exceeded|econnreset|fetch failed/i.test(message)) {
    return true;
  }

  if (typeof status === "number" && (status === 429 || status >= 500)) {
    return true;
  }

  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const delayMs = options.delayMs ?? 200;
  const maxDelayMs = options.maxDelayMs ?? 5000;
  const factor = options.factor ?? 2;
  const jitter = options.jitter ?? true;
  const label = options.label ?? "operation";
  const shouldRetry = options.shouldRetry ?? ((err) => isTransientError(err));

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const retryable = attempt < attempts && shouldRetry(err, attempt);

      if (!retryable) {
        logger.debug("retry.give_up", {
          label,
          attempt,
          attempts,
          ...errorFields(err),
        });
        throw err;
      }

      const wait = computeDelay(attempt, delayMs, maxDelayMs, factor, jitter);
      logger.warn("retry.attempt", {
        label,
        attempt,
        attempts,
        delayMs: wait,
        ...errorFields(err),
      });
      options.onRetry?.(err, attempt, wait);
      await sleep(wait);
    }
  }

  throw lastError;
}
