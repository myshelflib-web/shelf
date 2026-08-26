import { describe, expect, it } from "vitest";
import { chunkText } from "./chunkText.js";

describe("chunkText", () => {
  it("returns empty for blank", () => {
    expect(chunkText("   ")).toEqual([]);
  });

  it("keeps short text as one chunk", () => {
    expect(chunkText("hello notes")).toEqual(["hello notes"]);
  });

  it("splits long text with overlap", () => {
    const text = "a".repeat(2000);
    const chunks = chunkText(text, 900, 100);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].length).toBeLessThanOrEqual(900);
  });

  it("keeps heading sections as separate chunks when they fit", () => {
    const text = `## Intro\n${"alpha ".repeat(20)}\n\n## Later\n${"beta ".repeat(20)}`;
    const chunks = chunkText(text, 220, 20);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.some((c) => /intro/i.test(c))).toBe(true);
    expect(chunks.some((c) => /later/i.test(c))).toBe(true);
  });
});
