import { describe, expect, it } from "vitest";
import { shouldMirrorPreloadedArticle } from "./mirrorPolicy.js";

describe("mirrorPolicy", () => {
  it("mirrors official PDFs with OK links", () => {
    expect(
      shouldMirrorPreloadedArticle({
        sourceLicense: "OFFICIAL_DOCUMENT",
        pdfKey: null,
        sourceUrl: "https://ncert.nic.in/textbook/pdf/jesc1dd.pdf",
        linkStatus: "OK",
        embeddable: null,
      })
    ).toBe(true);
  });

  it("mirrors non-embeddable official PDFs", () => {
    expect(
      shouldMirrorPreloadedArticle({
        sourceLicense: "OFFICIAL_DOCUMENT",
        pdfKey: null,
        sourceUrl: "https://ncert.nic.in/textbook/pdf/jesc1dd.pdf",
        linkStatus: "OK",
        embeddable: false,
      })
    ).toBe(true);
  });

  it("skips embeddable official PDFs (remote proxy is enough)", () => {
    expect(
      shouldMirrorPreloadedArticle({
        sourceLicense: "OFFICIAL_DOCUMENT",
        pdfKey: null,
        sourceUrl: "https://ncert.nic.in/textbook/pdf/jesc1dd.pdf",
        linkStatus: "OK",
        embeddable: true,
      })
    ).toBe(false);
  });

  it("skips non-PDF official pages (summary fallback instead)", () => {
    expect(
      shouldMirrorPreloadedArticle({
        sourceLicense: "OFFICIAL_DOCUMENT",
        pdfKey: null,
        sourceUrl: "https://upsc.gov.in/exams/notification",
        linkStatus: "OK",
        embeddable: false,
      })
    ).toBe(false);
  });

  it("skips link-only and already mirrored articles", () => {
    expect(
      shouldMirrorPreloadedArticle({
        sourceLicense: "LINK_ONLY",
        pdfKey: null,
        sourceUrl: "https://pib.gov.in/example",
        linkStatus: "OK",
        embeddable: false,
      })
    ).toBe(false);

    expect(
      shouldMirrorPreloadedArticle({
        sourceLicense: "OFFICIAL_DOCUMENT",
        pdfKey: "admin/x/source.pdf",
        sourceUrl: "https://ncert.nic.in/a.pdf",
        linkStatus: "OK",
        embeddable: null,
      })
    ).toBe(false);
  });

  it("skips embeddable official HTML (iframe works)", () => {
    expect(
      shouldMirrorPreloadedArticle({
        sourceLicense: "OFFICIAL_DOCUMENT",
        pdfKey: null,
        sourceUrl: "https://example.gov.in/page",
        linkStatus: "OK",
        embeddable: true,
      })
    ).toBe(false);
  });
});
