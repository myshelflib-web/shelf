import { describe, expect, it } from "vitest";
import { hasParsedPageView, parsePageView } from "./pageView.js";

describe("parsePageView", () => {
  it("returns undefined for missing or invalid payloads", () => {
    expect(parsePageView(undefined)).toBeUndefined();
    expect(parsePageView(null)).toBeUndefined();
    expect(parsePageView("nope")).toBeUndefined();
    expect(parsePageView([1])).toBeUndefined();
  });

  it("accepts a PDF page and offset", () => {
    expect(
      parsePageView({ pdfPage: 47, pageOffset: 0.25, scale: 1.15 })
    ).toEqual({
      viewPdfPage: 47,
      viewPageOffset: 0.25,
      viewScale: 1.15,
    });
  });

  it("drops out-of-range fields", () => {
    const parsed = parsePageView({
      pdfPage: 0,
      pageOffset: 1.5,
      scrollTop: -4,
      scale: 9,
    });
    expect(parsed).toEqual({});
    expect(hasParsedPageView(parsed!)).toBe(false);
  });
});
