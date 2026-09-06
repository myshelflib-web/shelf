import { describe, expect, it } from "vitest";
import { termOverlapScore } from "./originalityCheck.js";

describe("termOverlapScore", () => {
  it("scores shared significant terms", () => {
    const a =
      "fundamental rights equality before law article 14 constitution of india";
    const b =
      "article 14 guarantees equality before law under the constitution of india";
    expect(termOverlapScore(a, b)).toBeGreaterThan(0.3);
  });

  it("returns near zero for unrelated text", () => {
    expect(
      termOverlapScore(
        "photosynthesis chlorophyll chloroplast sunlight glucose",
        "supreme court writ petition habeas corpus jurisdiction"
      )
    ).toBeLessThan(0.15);
  });
});
