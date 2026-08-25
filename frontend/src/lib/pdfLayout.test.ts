import { describe, expect, it } from "vitest";
import {
  EMPTY_PDF_FAST_SCROLL,
  fitPdfSheetScale,
  pdfFitPageSize,
  pdfPageCssSize,
  pdfPageRows,
  pdfReadPercent,
  updatePdfFastScroll,
  wheelDeltaPx,
} from "./pdfLayout";

describe("pdfPageRows", () => {
  it("stacks one page per row in single layout", () => {
    expect(pdfPageRows(3, "single")).toEqual([[1], [2], [3]]);
  });

  it("pairs pages side by side in spread layout", () => {
    expect(pdfPageRows(4, "spread")).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it("leaves an odd last page alone", () => {
    expect(pdfPageRows(5, "spread")).toEqual([[1, 2], [3, 4], [5]]);
  });
});

describe("pdfReadPercent", () => {
  it("returns 0 at the top and 100 at the bottom", () => {
    expect(pdfReadPercent(0, 1000, 400)).toBe(0);
    expect(pdfReadPercent(600, 1000, 400)).toBe(100);
    expect(pdfReadPercent(300, 1000, 400)).toBe(50);
  });

  it("returns 100 when content fits without scrolling", () => {
    expect(pdfReadPercent(0, 400, 400)).toBe(100);
  });
});

describe("fitPdfSheetScale", () => {
  it("fits a single A4-ish page into the viewport", () => {
    const scale = fitPdfSheetScale({
      layout: "single",
      containerW: 800,
      containerH: 1100,
      pageW: 595,
      pageH: 842,
    });
    expect(scale).toBeGreaterThan(0.35);
    expect(scale).toBeLessThanOrEqual(1.3);
    expect(595 * scale).toBeLessThanOrEqual(800 - 40 + 1);
    expect(842 * scale).toBeLessThanOrEqual(1100 - 48 + 1);
  });

  it("fits two pages side by side", () => {
    const scale = fitPdfSheetScale({
      layout: "spread",
      containerW: 1200,
      containerH: 800,
      pageW: 595,
      pageH: 842,
    });
    expect(595 * scale * 2 + 12).toBeLessThanOrEqual(1200 - 40 + 2);
    expect(842 * scale).toBeLessThanOrEqual(800 - 48 + 1);
  });
});

describe("pdfPageCssSize", () => {
  it("uses per-page size so a taller page is not clipped to page 1", () => {
    const sizes = {
      1: { w: 800, h: 800 },
      2: { w: 612, h: 1008 },
    };
    expect(pdfPageCssSize(2, sizes, { w: 720, h: 1020 })).toEqual({
      w: 612,
      h: 1008,
    });
    expect(pdfFitPageSize(sizes, { w: 720, h: 1020 })).toEqual({
      w: 800,
      h: 1008,
    });
  });
});

describe("updatePdfFastScroll", () => {
  it("stays off for a slow read-through", () => {
    let state = EMPTY_PDF_FAST_SCROLL;
    for (let i = 0; i < 6; i++) {
      state = updatePdfFastScroll(state, i * 16, 10);
    }
    expect(state.fast).toBe(false);
  });

  it("turns on for a fast flick and holds briefly", () => {
    let state = EMPTY_PDF_FAST_SCROLL;
    state = updatePdfFastScroll(state, 0, 80);
    expect(state.fast).toBe(true);
    state = updatePdfFastScroll(state, 80, 12);
    expect(state.fast).toBe(true);
    state = updatePdfFastScroll(state, 400, 10);
    expect(state.fast).toBe(false);
  });

  it("normalizes line-mode wheel deltas to pixels", () => {
    expect(wheelDeltaPx({ deltaY: 3, deltaMode: 1 }, 800)).toBe(48);
    expect(wheelDeltaPx({ deltaY: 40, deltaMode: 0 }, 800)).toBe(40);
  });
});
