import { describe, expect, it } from "vitest";
import { TimeoutError, withTimeout } from "./timeout.js";

describe("withTimeout", () => {
  it("resolves when work finishes in time", async () => {
    await expect(withTimeout(Promise.resolve(42), 100, "ok")).resolves.toBe(42);
  });

  it("rejects with TimeoutError when slow", async () => {
    const slow = new Promise((resolve) => setTimeout(resolve, 200));
    await expect(withTimeout(slow, 20, "slow")).rejects.toBeInstanceOf(TimeoutError);
  });
});
