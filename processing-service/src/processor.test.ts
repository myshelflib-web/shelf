import { describe, expect, it } from "vitest";
import { shouldKeepExistingHtml } from "./processor.js";

describe("shouldKeepExistingHtml", () => {
  it("keeps Gemini OCR HTML over empty extract", () => {
    const ocr = `<html><head><meta name="shelf-ocr" content="gemini"/></head><body><p>${"word ".repeat(40)}</p></body></html>`;
    const empty = "<html><body></body></html>";
    expect(shouldKeepExistingHtml(ocr, empty)).toBe(true);
  });

  it("overwrites when the new extract is longer", () => {
    const thin = "<html><body><p>hi</p></body></html>";
    const rich = `<html><body><p>${"paragraph ".repeat(50)}</p></body></html>`;
    expect(shouldKeepExistingHtml(thin, rich)).toBe(false);
  });
});
