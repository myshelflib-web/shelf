import { afterEach, describe, expect, it } from "vitest";
import { estimateCostInr, estimateCostPaise } from "./sarvamPricing.js";

afterEach(() => {
  delete process.env.SARVAM_INPUT_INR_PER_MTOK;
  delete process.env.SARVAM_OUTPUT_INR_PER_MTOK;
});

describe("sarvamPricing", () => {
  it("prices a million tokens at the published list rates", () => {
    expect(estimateCostInr(1_000_000, 0)).toBeCloseTo(29.28, 2);
    expect(estimateCostInr(0, 1_000_000)).toBeCloseTo(73.2, 2);
  });

  it("returns an integer paise amount", () => {
    const paise = estimateCostPaise(9_000, 6_500);
    expect(Number.isInteger(paise)).toBe(true);
    expect(paise).toBeGreaterThan(0);
  });

  it("honours per-deployment rate overrides", () => {
    process.env.SARVAM_INPUT_INR_PER_MTOK = "10";
    expect(estimateCostInr(1_000_000, 0)).toBeCloseTo(10, 2);
  });

  it("treats negative token counts as zero", () => {
    expect(estimateCostInr(-500, -500)).toBe(0);
  });
});
