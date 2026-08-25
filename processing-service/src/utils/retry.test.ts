import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { isTransientError, withRetry } from "./retry.js";

describe("isTransientError", () => {
  it("detects fetch and connection failures", () => {
    expect(isTransientError({ message: "fetch failed" })).toBe(true);
    expect(isTransientError({ code: "ECONNREFUSED" })).toBe(true);
    expect(isTransientError({ status: 502 })).toBe(true);
    expect(isTransientError({ status: 404 })).toBe(false);
  });
});

describe("withRetry", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("retries then succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ code: "ETIMEDOUT" })
      .mockResolvedValueOnce(42);

    const promise = withRetry(fn, {
      attempts: 3,
      delayMs: 5,
      jitter: false,
      label: "pdf-retry",
    });
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe(42);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
