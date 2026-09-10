import { describe, expect, it } from "vitest";
import {
  MAX_SYNC_RETRY_ATTEMPTS,
  isSyncRetryExhausted,
  syncBackoffMs,
  syncRetryExhaustedMessage,
} from "./syncBackoff";

describe("syncBackoff", () => {
  it("caps retry attempts", () => {
    expect(MAX_SYNC_RETRY_ATTEMPTS).toBe(10);
    expect(isSyncRetryExhausted(9)).toBe(false);
    expect(isSyncRetryExhausted(10)).toBe(true);
    expect(isSyncRetryExhausted(99)).toBe(true);
  });

  it("grows then caps delay", () => {
    expect(syncBackoffMs(0)).toBe(2_000);
    expect(syncBackoffMs(5)).toBe(120_000);
    expect(syncBackoffMs(99)).toBe(120_000);
  });

  it("describes exhaustion", () => {
    expect(syncRetryExhaustedMessage("upload")).toContain("10");
    expect(syncRetryExhaustedMessage("sync")).toContain("10");
  });
});
