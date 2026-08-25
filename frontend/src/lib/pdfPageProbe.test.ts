import { describe, expect, it } from "vitest";
import {
  pdfInitialProbePages,
  pdfResumePage,
} from "./pdfPageProbe";

describe("pdfResumePage", () => {
  it("clamps to valid range", () => {
    expect(pdfResumePage(undefined, 10)).toBe(1);
    expect(pdfResumePage(200, 150)).toBe(150);
    expect(pdfResumePage(0, 10)).toBe(1);
    expect(pdfResumePage(42, 100)).toBe(42);
  });
});

describe("pdfInitialProbePages", () => {
  it("probes saved page plus neighbors", () => {
    expect(pdfInitialProbePages(50, 100)).toEqual([50, 49, 51]);
  });

  it("handles first page", () => {
    expect(pdfInitialProbePages(1, 10)).toEqual([1, 2]);
  });

  it("handles last page", () => {
    expect(pdfInitialProbePages(10, 10)).toEqual([10, 9]);
  });
});
