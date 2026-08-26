import { describe, expect, it } from "vitest";
import {
  PAGE_ASK_CONTEXT_BUDGET,
  joinPackedContext,
  packPageAskContext,
  isThinPageText,
} from "./pageAskContext.js";

describe("packPageAskContext", () => {
  const longFile = "A".repeat(20_000) + " middle topic mesh " + "B".repeat(5_000);

  it("stays under the budget with a highlight", () => {
    const packed = packPageAskContext({
      selection: "mesh topology is a combination of star and bus",
      fullFileText: longFile,
      pageChunks: [
        "Tree topology expands star networks across floors.",
        "Bus topology shares a single backbone cable.",
        "Star topology connects nodes to a central hub.",
        "Hybrid networks combine multiple topologies.",
        "mesh topology is a combination of star and bus", // duplicate of highlight
      ],
      related: [
        {
          title: "Networking notes",
          notebook: "CS",
          topic: "OSI",
          text: "Physical layer carries raw bits over media.",
        },
        {
          title: "Other",
          notebook: "CS",
          topic: "",
          text: "Unrelated chemistry notes should still fit if budget remains.",
        },
      ],
    });

    const joined = joinPackedContext(packed);
    expect(packed.charsUsed).toBeLessThanOrEqual(PAGE_ASK_CONTEXT_BUDGET);
    expect(joined.length).toBeLessThanOrEqual(PAGE_ASK_CONTEXT_BUDGET + 80);
    expect(packed.selectionBlock).toContain("highlight");
    expect(packed.pageVectorBlock.length).toBeGreaterThan(0);
    // Duplicate highlight chunk should be filtered from page vectors.
    expect(packed.pageVectorBlock).not.toMatch(/combination of star and bus/);
  });

  it("uses more file body when nothing is selected and vectors are sparse", () => {
    const packed = packPageAskContext({
      fullFileText: longFile,
      pageChunks: ["only one weak chunk"],
      related: [],
    });
    expect(packed.fileBlock.length).toBeGreaterThan(1000);
    expect(packed.charsUsed).toBeLessThanOrEqual(PAGE_ASK_CONTEXT_BUDGET);
  });

  it("treats title-only bodies as thin scanned files", () => {
    expect(isThinPageText("My Page", "My Page")).toBe(true);
    expect(isThinPageText("My Page", "")).toBe(true);
    expect(isThinPageText("My Page", "Hello ".repeat(40))).toBe(false);
  });

  it("does not pack a title-only body as if it were the document", () => {
    const packed = packPageAskContext({
      fullFileText: isThinPageText("My Page", "My Page") ? "" : "My Page",
      pageChunks: [],
      related: [],
    });
    expect(joinPackedContext(packed)).toBe("");
  });
});
