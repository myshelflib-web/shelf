import { describe, expect, it } from "vitest";
import { resolveCurriculumSavePolicy } from "./curriculumSavePolicy.js";

describe("resolveCurriculumSavePolicy", () => {
  it("uses admin copy when pdfKey exists", () => {
    const policy = resolveCurriculumSavePolicy({
      pdfKey: "admin/x/source.pdf",
      contentUrl: null,
      sourceUrl: "https://example.com/a.pdf",
      sourceLicense: "OFFICIAL_DOCUMENT",
    });
    expect(policy.mode).toBe("copy_admin");
    expect(policy.allowed).toBe(true);
  });

  it("embeds official docs without admin storage", () => {
    const policy = resolveCurriculumSavePolicy({
      pdfKey: null,
      contentUrl: "admin/x/content.html",
      sourceUrl: "https://ncert.nic.in/textbook.pdf",
      sourceLicense: "OFFICIAL_DOCUMENT",
    });
    expect(policy.embedUrl).toContain("ncert");
    expect(policy.mode).toBe("download_remote");
    expect(policy.allowed).toBe(true);
  });

  it("saves link-only sources as bookmarks", () => {
    const policy = resolveCurriculumSavePolicy({
      pdfKey: null,
      contentUrl: "admin/x/content.html",
      sourceUrl: "https://prsindia.org/",
      sourceLicense: "LINK_ONLY",
    });
    expect(policy.mode).toBe("link");
    expect(policy.allowed).toBe(true);
  });

  it("falls back to link save when license is unknown", () => {
    const policy = resolveCurriculumSavePolicy({
      pdfKey: null,
      contentUrl: null,
      sourceUrl: "https://example.com/doc.pdf",
      sourceLicense: null,
    });
    expect(policy.allowed).toBe(true);
    expect(policy.mode).toBe("link");
  });
});
