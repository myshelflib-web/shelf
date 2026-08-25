import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { isTransientError, withRetry } from "./retry.js";

describe("isTransientError", () => {
  it("detects network-style errors", () => {
    expect(isTransientError({ code: "ECONNRESET" })).toBe(true);
    expect(isTransientError({ name: "TimeoutError" })).toBe(true);
    expect(isTransientError({ message: "fetch failed" })).toBe(true);
    expect(isTransientError({ message: "validation failed" })).toBe(false);
  });

  it("detects 429 and 5xx status codes", () => {
    expect(isTransientError({ statusCode: 429 })).toBe(true);
    expect(isTransientError({ $metadata: { httpStatusCode: 503 } })).toBe(true);
    expect(isTransientError({ statusCode: 400 })).toBe(false);
  });

  it("returns false for non-objects", () => {
    expect(isTransientError(null)).toBe(false);
    expect(isTransientError("boom")).toBe(false);
  });
});

describe("withRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withRetry(fn, { attempts: 3, label: "test" })).resolves.toBe(
      "ok"
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries transient failures then succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ code: "ECONNRESET" })
      .mockResolvedValueOnce("done");

    const promise = withRetry(fn, {
      attempts: 3,
      delayMs: 10,
      jitter: false,
      label: "retry-test",
    });

    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe("done");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-transient errors", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("bad input"));
    await expect(
      withRetry(fn, { attempts: 3, delayMs: 10, jitter: false })
    ).rejects.toThrow("bad input");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
