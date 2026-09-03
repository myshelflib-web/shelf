import { describe, expect, it, vi } from "vitest";
import {
  OFFLINE_CACHE_TTL_MS,
  cacheAgeMs,
  isCacheFresh,
} from "./cacheTtl";

describe("cacheTtl", () => {
  it("treats recent timestamps as fresh", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    expect(isCacheFresh(now)).toBe(true);
    expect(isCacheFresh(now - OFFLINE_CACHE_TTL_MS + 1)).toBe(true);
  });

  it("treats expired timestamps as stale", () => {
    const now = Date.now();
    vi.setSystemTime(now);
    expect(isCacheFresh(now - OFFLINE_CACHE_TTL_MS)).toBe(false);
    expect(isCacheFresh(undefined)).toBe(false);
  });

  it("computes cache age", () => {
    const now = 1_000_000;
    vi.setSystemTime(now);
    expect(cacheAgeMs(now - 500)).toBe(500);
    expect(cacheAgeMs(null)).toBeNull();
  });
});
