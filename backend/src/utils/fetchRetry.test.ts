import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  fetchWithRetry,
  HttpResponseError,
  isRetryableHttpStatus,
} from "./fetchRetry.js";

vi.mock("./timeout.js", () => ({
  fetchWithTimeout: vi.fn(),
}));

vi.mock("./metrics.js", () => ({
  metrics: { inc: vi.fn() },
}));

import { fetchWithTimeout } from "./timeout.js";
import { metrics } from "./metrics.js";

describe("isRetryableHttpStatus", () => {
  it("treats 429 and 5xx as retryable", () => {
    expect(isRetryableHttpStatus(429)).toBe(true);
    expect(isRetryableHttpStatus(500)).toBe(true);
    expect(isRetryableHttpStatus(503)).toBe(true);
    expect(isRetryableHttpStatus(404)).toBe(false);
    expect(isRetryableHttpStatus(400)).toBe(false);
  });
});

describe("HttpResponseError", () => {
  it("carries status and response", () => {
    const response = new Response("", { status: 502 });
    const err = new HttpResponseError("bad gateway", 502, response);
    expect(err.status).toBe(502);
    expect(err.response).toBe(response);
  });
});

describe("fetchWithRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(fetchWithTimeout).mockReset();
    vi.mocked(metrics.inc).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns successful responses without retrying", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValue(
      new Response("ok", { status: 200 })
    );

    const res = await fetchWithRetry("http://example.test", {
      retry: { jitter: false },
    });

    expect(res.status).toBe(200);
    expect(fetchWithTimeout).toHaveBeenCalledTimes(1);
    expect(metrics.inc).not.toHaveBeenCalled();
  });

  it("retries 503 then succeeds", async () => {
    vi.mocked(fetchWithTimeout)
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));

    const promise = fetchWithRetry("http://example.test", {
      retry: { attempts: 3, delayMs: 10, jitter: false, label: "test" },
    });

    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.status).toBe(200);
    expect(fetchWithTimeout).toHaveBeenCalledTimes(2);
    expect(metrics.inc).toHaveBeenCalledWith("fetch_retries_total", {
      label: "test",
    });
  });

  it("does not retry 4xx client errors", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValue(
      new Response("nope", { status: 404 })
    );

    const res = await fetchWithRetry("http://example.test", {
      retry: { attempts: 3, delayMs: 10, jitter: false },
    });

    expect(res.status).toBe(404);
    expect(fetchWithTimeout).toHaveBeenCalledTimes(1);
  });
});
