import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fetchWithRetry } from "./fetchRetry";

describe("fetchWithRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("ok", { status: 200 }))
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("retries GET on 503 then succeeds", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));

    const promise = fetchWithRetry("http://example.test", {
      attempts: 3,
    });

    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("does not retry POST after a 503 response", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("", { status: 503 }));

    const res = await fetchWithRetry("http://example.test", {
      method: "POST",
      attempts: 3,
    });

    expect(res.status).toBe(503);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries POST on network failure", async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));

    const promise = fetchWithRetry("http://example.test", {
      method: "POST",
      attempts: 3,
    });

    await vi.runAllTimersAsync();
    const res = await promise;

    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
