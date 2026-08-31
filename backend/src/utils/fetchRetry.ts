import { fetchWithTimeout } from "./timeout.js";
import { isTransientError, withRetry, type RetryOptions } from "./retry.js";
import { metrics } from "./metrics.js";

export class HttpResponseError extends Error {
  readonly status: number;
  readonly response: Response;

  constructor(message: string, status: number, response: Response) {
    super(message);
    this.name = "HttpResponseError";
    this.status = status;
    this.response = response;
  }
}

export function isRetryableHttpStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

export type FetchRetryOptions = RequestInit & {
  timeoutMs?: number;
  retry?: RetryOptions;
};

/** fetch + timeout + exponential backoff on network errors and 429/5xx. */
export async function fetchWithRetry(
  url: string,
  init: FetchRetryOptions = {}
): Promise<Response> {
  const { retry, timeoutMs, ...rest } = init;
  const label = retry?.label ?? "fetch";

  return withRetry(
    async () => {
      const res = await fetchWithTimeout(url, { ...rest, timeoutMs });
      if (!isRetryableHttpStatus(res.status)) {
        return res;
      }
      throw new HttpResponseError(
        `HTTP ${res.status} for ${url}`,
        res.status,
        res
      );
    },
    {
      attempts: retry?.attempts ?? 4,
      delayMs: retry?.delayMs ?? 300,
      maxDelayMs: retry?.maxDelayMs ?? 10_000,
      factor: retry?.factor ?? 2,
      jitter: retry?.jitter ?? true,
      label,
      shouldRetry: (err, attempt) => {
        if (retry?.shouldRetry && !retry.shouldRetry(err, attempt)) {
          return false;
        }
        if (err instanceof HttpResponseError) {
          return isRetryableHttpStatus(err.status);
        }
        return isTransientError(err);
      },
      onRetry: (err, attempt, delayMs) => {
        metrics.inc("fetch_retries_total", { label });
        retry?.onRetry?.(err, attempt, delayMs);
      },
    }
  );
}
