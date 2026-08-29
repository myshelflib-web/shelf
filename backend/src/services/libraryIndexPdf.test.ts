import { describe, expect, it } from "vitest";
import {
  pdfIndexFileTooLarge,
  pdfIndexRangeTooLarge,
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
    expect(pdfIndexRangeTooLarge(3 * 1024 * 1024)).toBe(true);
  });

  it("only skips enormous files (pdf.js still maps file length)", () => {
    expect(pdfIndexFileTooLarge(1024)).toBe(false);
    expect(pdfIndexFileTooLarge(20 * 1024 * 1024)).toBe(false);
    expect(pdfIndexFileTooLarge(80 * 1024 * 1024)).toBe(true);
  });
});
