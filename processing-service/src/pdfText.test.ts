import { describe, expect, it } from "vitest";
import { shouldAbortEmptyPdfExtract } from "./pdfExtract.js";
import { normalizePdfText } from "./pdfText.js";

describe("normalizePdfText", () => {
  it("joins spaced single letters", () => {
    expect(normalizePdfText("Lucknow Public Sch ool")).toBe(
      "Lucknow Public School"
    );
  });

  it("joins split words", () => {
    expect(normalizePdfText("CBSE Board Perce ntage - 91")).toBe(
      "CBSE Board Percentage - 91"
    );
  });
});

describe("shouldAbortEmptyPdfExtract", () => {
  it("stops walking scanned PDFs after a few blank pages", () => {
    expect(shouldAbortEmptyPdfExtract(5, 0)).toBe(false);
    expect(shouldAbortEmptyPdfExtract(6, 0)).toBe(true);
    expect(shouldAbortEmptyPdfExtract(6, 500)).toBe(false);
  });
});
