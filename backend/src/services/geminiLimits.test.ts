import { describe, expect, it } from "vitest";
import {
  acquireSlidingWindow,
  parseGeminiRetryMs,
} from "./geminiLimits.js";

describe("geminiLimits", () => {
  it("parses provider retry-in seconds", () => {
    expect(parseGeminiRetryMs("Please retry in 21.5s.", 1)).toBe(22000);
  });

  it("uses 4s Flash-Lite backoff when the body has no hint", () => {
    expect(parseGeminiRetryMs("Resource exhausted", 1)).toBe(4000);
    expect(parseGeminiRetryMs("Resource exhausted", 2)).toBe(8000);
    expect(parseGeminiRetryMs("Resource exhausted", 3)).toBe(16000);
  });

  it("paces a sliding window under the RPM cap", async () => {
    let t = 0;
    const clock = {
      now: () => t,
      sleep: async (ms: number) => {
        t += ms;
      },
    };
    const stamps: number[] = [];
    await acquireSlidingWindow(stamps, 3, clock);
    t = 1_000;
    await acquireSlidingWindow(stamps, 3, clock);
    expect(stamps).toHaveLength(2);
    expect(t).toBe(1_000);
    await acquireSlidingWindow(stamps, 3, clock);
    expect(t).toBeGreaterThanOrEqual(60_000);
    expect(stamps.length).toBeGreaterThanOrEqual(1);
    expect(stamps.length).toBeLessThanOrEqual(2);
  });
});
