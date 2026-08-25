import { describe, expect, it } from "vitest";
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
