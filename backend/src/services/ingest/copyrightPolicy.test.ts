import { describe, expect, it } from "vitest";
import {
  applyLicensePolicy,
  buildShelfSummary,
  mayFetchPageBody,
  trimExcerpt,
} from "./copyrightPolicy.js";

describe("copyrightPolicy", () => {
  it("trims excerpts to safe length", () => {
    const long = "a".repeat(400);
    expect(trimExcerpt(long)?.length).toBeLessThanOrEqual(280);
  });

  it("never marks link-only as full document", () => {
    const stored = applyLicensePolicy("LINK_ONLY", {
      title: "Budget headline",
      rssDescription: "Some newspaper lede we must not republish at length.",
      sourceName: "Example",
    });
    expect(stored.fullDocumentStored).toBe(false);
    expect(stored.factualExcerpt).toBeNull();
    expect(stored.shelfSummary).toContain("Budget headline");
  });

  it("does not mark official PDFs for admin storage (embed until user saves)", () => {
    const stored = applyLicensePolicy("OFFICIAL_DOCUMENT", {
      title: "CSE Notification 2025",
      sourceName: "UPSC",
      isPdfDownload: true,
    });
    expect(stored.fullDocumentStored).toBe(false);
    expect(stored.shelfSummary).toContain("save to your library");
  });

  it("blocks page body fetch for link-only", () => {
    expect(mayFetchPageBody("LINK_ONLY")).toBe(false);
    expect(mayFetchPageBody("OFFICIAL_DOCUMENT")).toBe(true);
  });

  it("builds summary pointing to source", () => {
    const s = buildShelfSummary({
      title: "Cabinet approves scheme",
      excerpt: "Short gov lede.",
      sourceName: "PIB",
    });
    expect(s).toContain("Cabinet approves scheme");
  });
});
