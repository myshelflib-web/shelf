import { describe, expect, it } from "vitest";
import { pendingUploadBackoffMs } from "./pendingUploadQueue";

describe("pendingUploadBackoffMs", () => {
  it("grows then caps", () => {
    expect(pendingUploadBackoffMs(0)).toBe(2_000);
    expect(pendingUploadBackoffMs(1)).toBe(5_000);
    expect(pendingUploadBackoffMs(2)).toBe(15_000);
    expect(pendingUploadBackoffMs(5)).toBe(120_000);
    expect(pendingUploadBackoffMs(99)).toBe(120_000);
  });
});
