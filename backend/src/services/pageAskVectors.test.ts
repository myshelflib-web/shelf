import { describe, expect, it } from "vitest";
import {
  pageAskRetrieveOpts,
  shouldRetrievePageVectors,
} from "./pageAskVectors.js";

describe("shouldRetrievePageVectors", () => {
  const base = {
    pageId: "p1",
    forceVectors: false,
    depth: "quick" as const,
    hasSelection: false,
    thinText: false,
    fullFileText: "x".repeat(12_000),
    resolvedMode: "summarize" as const,
    mapReduceEligible: false,
  };

  it("skips retrieval for quick summarize on a large file", () => {
    expect(shouldRetrievePageVectors(base)).toBe(false);
  });

  it("still retrieves for quick ask on a large file", () => {
    expect(
      shouldRetrievePageVectors({ ...base, resolvedMode: "ask" })
    ).toBe(true);
  });

  it("skips when map-reduce will list vectors separately", () => {
    expect(
      shouldRetrievePageVectors({ ...base, mapReduceEligible: true })
    ).toBe(false);
  });
});

describe("pageAskRetrieveOpts", () => {
  it("disables whole-page scroll on quick depth", () => {
    expect(
      pageAskRetrieveOpts({
        depth: "quick",
        hasSelection: false,
        resolvedMode: "ask",
        userQuestion: "What is chapter 4?",
        expandedPrompt: false,
      }).coverWholePage
    ).toBe(false);
  });
});
