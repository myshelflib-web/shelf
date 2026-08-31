import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { isTransientDbError, withDbRetry } from "./dbRetry.js";

vi.mock("./metrics.js", () => ({
  metrics: { inc: vi.fn() },
}));

import { metrics } from "./metrics.js";

describe("isTransientDbError", () => {
  it("detects transient Prisma connection codes", () => {
    expect(isTransientDbError({ code: "P1001" })).toBe(true);
    expect(isTransientDbError({ code: "P2024" })).toBe(true);
    expect(isTransientDbError({ code: "P2002" })).toBe(false);
  });

  it("falls back to generic transient network errors", () => {
    expect(isTransientDbError({ code: "ECONNRESET" })).toBe(true);
    expect(isTransientDbError(new Error("validation failed"))).toBe(false);
  });
});

describe("withDbRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(metrics.inc).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries transient Prisma errors", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ code: "P1001" })
      .mockResolvedValueOnce("ok");

    const promise = withDbRetry(fn, {
      attempts: 3,
      delayMs: 10,
      jitter: false,
      label: "test-db",
    });

    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
    expect(metrics.inc).toHaveBeenCalledWith("db_retries_total", {
      label: "test-db",
    });
  });

  it("does not retry permanent errors", async () => {
    const fn = vi.fn().mockRejectedValue({ code: "P2002" });

    await expect(
      withDbRetry(fn, { attempts: 3, delayMs: 10, jitter: false })
    ).rejects.toEqual({ code: "P2002" });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
