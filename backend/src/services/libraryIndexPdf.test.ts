import { describe, expect, it } from "vitest";
import {
  pdfIndexFileTooLarge,
  pdfIndexRangeTooLarge,
  PDF_INDEX_HARD_MAX_BYTES,
  pdfTextItemsToLines,
} from "./libraryIndexPdf.js";

describe("pdfTextItemsToLines", () => {
  it("joins same-line fragments and splits on y jumps", () => {
    const lines = pdfTextItemsToLines([
      { str: "Hello", transform: [0, 0, 0, 0, 0, 100] },
      { str: "world", transform: [0, 0, 0, 0, 40, 100] },
      { str: "Next", transform: [0, 0, 0, 0, 0, 80] },
    ]);
    expect(lines).toEqual(["Hello world", "Next"]);
  });

  it("skips empty items", () => {
    expect(pdfTextItemsToLines([{ str: "" }, { str: "Ok", transform: [0, 0, 0, 0, 0, 1] }])).toEqual(
      ["Ok"]
    );
  });
});

describe("pdf index size caps", () => {
  it("refuses a Range GET that would buffer the whole file", () => {
    expect(pdfIndexRangeTooLarge(64 * 1024)).toBe(false);
    expect(pdfIndexRangeTooLarge(2 * 1024 * 1024)).toBe(true);
  });

  it("hard-caps pdf.js file mapping at 24MB on 512MB hosts", () => {
    expect(pdfIndexFileTooLarge(1024)).toBe(false);
    expect(pdfIndexFileTooLarge(20 * 1024 * 1024)).toBe(false);
    expect(pdfIndexFileTooLarge(PDF_INDEX_HARD_MAX_BYTES + 1)).toBe(true);
    expect(pdfIndexFileTooLarge(80 * 1024 * 1024)).toBe(true);
  });
});
