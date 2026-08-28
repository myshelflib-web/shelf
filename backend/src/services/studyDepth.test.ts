import { describe, expect, it } from "vitest";
import {
  mayPrepareMapReduce,
  parseStudyDepth,
  shouldMapReduce,
  studyDepthConfig,
} from "./studyDepth.js";

describe("studyDepth", () => {
  it("parses depth values", () => {
    expect(parseStudyDepth("quick")).toBe("quick");
    expect(parseStudyDepth("standard")).toBe("standard");
    expect(parseStudyDepth("deep")).toBe("deep");
    expect(parseStudyDepth("invalid")).toBe("quick");
  });

  it("increases limits for standard and deep", () => {
    const quick = studyDepthConfig("quick");
    const standard = studyDepthConfig("standard");
    const deep = studyDepthConfig("deep");
    expect(standard.maxTokens).toBeGreaterThan(quick.maxTokens);
    expect(deep.maxTokens).toBeGreaterThan(standard.maxTokens);
    expect(deep.pageContextBudget).toBeGreaterThan(quick.pageContextBudget);
  });

  it("only deep-summary on Think longer triggers map-reduce", () => {
    expect(
      shouldMapReduce({
        depth: "quick",
        mode: "deep-summary",
        materialChars: 20_000,
        chunkCount: 3,
      })
    ).toBe(false);
    expect(
      shouldMapReduce({
        depth: "deep",
        mode: "summarize",
        materialChars: 50_000,
        chunkCount: 20,
      })
    ).toBe(false);
    expect(
      shouldMapReduce({
        depth: "deep",
        mode: "deep-summary",
        materialChars: 20_000,
        chunkCount: 3,
      })
    ).toBe(true);
    expect(
      shouldMapReduce({
        depth: "quick",
        mode: "ask",
        materialChars: 50_000,
        chunkCount: 20,
      })
    ).toBe(false);
  });

  it("skips map-reduce prep for quick ask", () => {
    expect(
      mayPrepareMapReduce({
        depth: "quick",
        mode: "ask",
        materialChars: 50_000,
        hasSelection: false,
      })
    ).toBe(false);
    expect(
      mayPrepareMapReduce({
        depth: "quick",
        mode: "summarize",
        materialChars: 15_000,
        hasSelection: false,
      })
    ).toBe(false);
  });
});
