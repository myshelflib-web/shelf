import { describe, expect, it } from "vitest";
import { resolvePreloadedLearnPage } from "./preloadedLearnPage";

describe("resolvePreloadedLearnPage", () => {
  it("uses PDF viewer for official PDF urls", () => {
    expect(
      resolvePreloadedLearnPage({
        title: "Book",
        content: null,
        hasPdf: false,
        sourceUrl: "https://ncert.nic.in/textbook/pdf/hess301.pdf",
        summary: "History",
        embeddable: null,
        linkStatus: "UNKNOWN",
        sourceLicense: null,
      }).contentType
    ).toBe("PDF");
  });

  it("uses iframe only when embed is explicitly allowed", () => {
    expect(
      resolvePreloadedLearnPage({
        title: "Site",
        content: null,
        hasPdf: false,
        sourceUrl: "https://example.com/page",
        summary: "Notes",
        embeddable: true,
        linkStatus: "OK",
        sourceLicense: "OFFICIAL_DOCUMENT",
      })
    ).toMatchObject({ contentType: "LINK", useLinkEmbed: true });
  });

  it("shows summary HTML for blocked government portals", () => {
    const resolved = resolvePreloadedLearnPage({
      title: "RBI",
      content: null,
      hasPdf: false,
      sourceUrl: "https://www.rbi.org.in/",
      summary: "Central bank portal",
      embeddable: false,
      linkStatus: "BLOCKED_EMBED",
      sourceLicense: "LINK_ONLY",
    });
    expect(resolved.contentType).toBe("HTML");
    expect(resolved.content).toContain("Central bank portal");
    expect(resolved.content).toContain("Open on official site");
  });

  it("shows summary HTML when MCA was incorrectly marked embeddable", () => {
    const resolved = resolvePreloadedLearnPage({
      title: "Ministry of Corporate Affairs",
      content: null,
      hasPdf: false,
      sourceUrl: "https://www.mca.gov.in/",
      summary: "Companies Act and corporate law notifications from MCA.",
      embeddable: true,
      linkStatus: "OK",
      sourceLicense: "LINK_ONLY",
    });
    expect(resolved).toMatchObject({ contentType: "HTML", useLinkEmbed: false });
    expect(resolved.content).toContain("Open on official site");
  });
});
