import { describe, expect, it } from "vitest";
import { buildPreloadedSummaryHtml } from "./preloadedSummaryHtml";

describe("buildPreloadedSummaryHtml", () => {
  it("includes styled fallback and save instructions", () => {
    const html = buildPreloadedSummaryHtml(
      "Union Budget documents",
      "https://www.indiabudget.gov.in/",
      "Official India Budget portal."
    );
    expect(html).toContain("preloaded-official-fallback");
    expect(html).toContain("Open on official site");
    expect(html).toContain("Save to library");
  });
});
