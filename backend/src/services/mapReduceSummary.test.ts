import { describe, expect, it } from "vitest";
import { splitIntoSections } from "./mapReduceSummary.js";

describe("splitIntoSections", () => {
  it("returns empty for blank input", () => {
    expect(splitIntoSections("   ")).toEqual([]);
  });

  it("keeps short text as one section", () => {
    expect(splitIntoSections("hello world")).toEqual(["hello world"]);
  });

  it("splits long text into multiple sections", () => {
    const text = "A".repeat(12_000);
    const parts = splitIntoSections(text, 4_500);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.join("").length).toBeGreaterThanOrEqual(11_900);
  });
});
