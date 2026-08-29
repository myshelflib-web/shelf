import { describe, expect, it } from "vitest";
import {
  buildShelfOcrHtml,
  parseGeminiOcrText,
  pdfPageNeedsOcr,
} from "./pdfOcr.js";

describe("pdfPageNeedsOcr", () => {
  it("flags image-only pages", () => {
    expect(pdfPageNeedsOcr("")).toBe(true);
    expect(pdfPageNeedsOcr("  12  ")).toBe(true);
    expect(pdfPageNeedsOcr("Federalism splits power between Union and States.")).toBe(
      false
    );
  });
});

describe("parseGeminiOcrText", () => {
  it("reads candidate text and ignores blank pages", () => {
    expect(
      parseGeminiOcrText({
        candidates: [{ content: { parts: [{ text: "Preamble to the Constitution." }] } }],
      })
    ).toBe("Preamble to the Constitution.");
    expect(
      parseGeminiOcrText({
        candidates: [{ content: { parts: [{ text: "[blank page]" }] } }],
      })
    ).toBeNull();
  });
});

describe("buildShelfOcrHtml", () => {
  it("marks OCR HTML so the processor will not overwrite it", () => {
    const html = buildShelfOcrHtml("Hello\n\nWorld");
    expect(html).toContain('name="shelf-ocr"');
    expect(html).toContain("<p>Hello</p>");
    expect(html).toContain("<p>World</p>");
  });
});
