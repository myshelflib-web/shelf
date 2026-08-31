function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt: number): number {
  const base = 400 * Math.pow(2, attempt - 1);
  const spread = base * 0.2;
  return Math.round(base - spread + Math.random() * spread * 2);
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

export type ClientFetchRetryOptions = RequestInit & {
  /** Max attempts including the first try. Default 3. */
  attempts?: number;
  /** Retry GET/HEAD on 429/502/503/504. Default true. */
  retrySafeMethods?: boolean;
};

/**
 * Browser fetch with exponential backoff.
 * - All methods: retry on network failure (offline / DNS).
 * - GET/HEAD only: also retry on 429/502/503/504 (Render cold start, gateway blips).
 * - POST/PATCH/DELETE: never retry after a response (avoid duplicate mutations).
 */
export async function fetchWithRetry(
  url: string,
  init: ClientFetchRetryOptions = {}
): Promise<Response> {
  const attempts = init.attempts ?? 3;
  const method = (init.method ?? "GET").toUpperCase();
  const safeMethod =
    init.retrySafeMethods !== false &&
    (method === "GET" || method === "HEAD");

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok || !safeMethod || !isRetryableStatus(res.status)) {
        return res;
      }
      if (attempt >= attempts) return res;
      await sleep(backoffMs(attempt));
    } catch (err) {
      lastError = err;
      if (attempt >= attempts) throw err;
      await sleep(backoffMs(attempt));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("fetchWithRetry failed");
}
