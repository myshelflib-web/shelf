import { describe, expect, it } from "vitest";
import {
  pageAskRetrieveOpts,
  shouldRetrievePageVectors,
} from "./pageAskVectors.js";
import { studyToolLoopOpts } from "./studyToolOpts.js";
import { studyDepthConfig } from "./studyDepth.js";

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

  it("skips retrieval for quick on a large file", () => {
    expect(shouldRetrievePageVectors(base)).toBe(false);
    expect(
      shouldRetrievePageVectors({ ...base, resolvedMode: "ask" })
    ).toBe(false);
  });

  it("still retrieves for quick when text is thin or highlighted", () => {
    expect(shouldRetrievePageVectors({ ...base, thinText: true })).toBe(true);
    expect(shouldRetrievePageVectors({ ...base, hasSelection: true })).toBe(
      true
    );
  });

  it("retrieves for standard on a large file", () => {
    expect(
      shouldRetrievePageVectors({ ...base, depth: "standard" })
    ).toBe(true);
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

describe("studyToolLoopOpts", () => {
  it("omits llm overrides on quick (legacy fast path)", () => {
    const cfg = studyDepthConfig("quick");
    const opts = studyToolLoopOpts({
      depth: "quick",
      depthConfig: cfg,
      toolsEnabled: true,
      webSearchEnabled: false,
    });
    expect(opts.enabled).toBe(true);
    expect(opts.llm).toBeUndefined();
    expect(opts.maxToolRounds).toBeUndefined();
  });

  it("passes depth llm opts for standard", () => {
    const cfg = studyDepthConfig("standard");
    const opts = studyToolLoopOpts({
      depth: "standard",
      depthConfig: cfg,
      toolsEnabled: true,
      webSearchEnabled: true,
    });
    expect(opts.llm?.model).toBe(cfg.model);
    expect(opts.maxToolRounds).toBe(cfg.toolRounds);
  });
});
