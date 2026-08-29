import { describe, expect, it } from "vitest";
import {
  PDF_SCALE_MAX,
  PDF_SCALE_MIN,
  applyPdfVisualZoom,
  applyPdfZoomAnchor,
  capturePdfZoomAnchor,
  clearPdfVisualZoom,
  clampPdfScale,
  isPdfZoomWheel,
  nextPdfWheelScale,
  pdfVisualZoomOrigin,
} from "./pdfZoom";

describe("clampPdfScale", () => {
  it("keeps values inside the viewer range", () => {
    expect(clampPdfScale(1)).toBe(1);
    expect(clampPdfScale(0)).toBe(PDF_SCALE_MIN);
    expect(clampPdfScale(8)).toBe(PDF_SCALE_MAX);
  });
});

describe("isPdfZoomWheel", () => {
  it("treats ctrl/cmd wheel and trackpad pinch as zoom", () => {
    expect(isPdfZoomWheel({ ctrlKey: true, metaKey: false })).toBe(true);
    expect(isPdfZoomWheel({ ctrlKey: false, metaKey: true })).toBe(true);
    expect(isPdfZoomWheel({ ctrlKey: false, metaKey: false })).toBe(false);
  });
});

describe("nextPdfWheelScale", () => {
  it("zooms in on a negative delta (pinch or ctrl+wheel up)", () => {
    expect(nextPdfWheelScale(1, -20, 0)).toBeGreaterThan(1);
  });

  it("zooms out on a positive delta", () => {
    expect(nextPdfWheelScale(1, 20, 0)).toBeLessThan(1);
  });

  it("caps a fat mouse-wheel tick so one notch is not a jump", () => {
    const next = nextPdfWheelScale(1, 120, 0);
    expect(next).toBeGreaterThanOrEqual(1 - 0.12);
    expect(next).toBeLessThan(1);
  });

  it("does not pass the min/max", () => {
    expect(nextPdfWheelScale(PDF_SCALE_MIN, 80, 0)).toBe(PDF_SCALE_MIN);
    expect(nextPdfWheelScale(PDF_SCALE_MAX, -80, 0)).toBe(PDF_SCALE_MAX);
  });
});

describe("pdf zoom scroll anchor", () => {
  it("keeps the point under the cursor after a 2x zoom", () => {
    const root = {
      getBoundingClientRect: () => ({ left: 100, top: 50 }) as DOMRect,
      scrollLeft: 200,
      scrollTop: 400,
    };
    const anchor = capturePdfZoomAnchor(root, 180, 130, 2);
    expect(anchor.cursorX).toBe(80);
    expect(anchor.cursorY).toBe(80);
    const next = { scrollLeft: 0, scrollTop: 0 };
    applyPdfZoomAnchor(next, anchor);
    expect(next.scrollLeft).toBe(480);
    expect(next.scrollTop).toBe(880);
  });
});

describe("pdf visual zoom", () => {
  it("captures origin relative to the content box", () => {
    const content = {
      getBoundingClientRect: () => ({ left: 40, top: 20 }) as DOMRect,
    };
    expect(pdfVisualZoomOrigin(content, 90, 70)).toEqual({ x: 50, y: 50 });
  });

  it("applies a CSS scale around the origin and clears it", () => {
    const style = { transform: "", transformOrigin: "" };
    const el = { style } as unknown as HTMLElement;
    applyPdfVisualZoom(el, 12, 24, 1.5);
    expect(style.transformOrigin).toBe("12px 24px");
    expect(style.transform).toBe("scale(1.5)");
    clearPdfVisualZoom(el);
    expect(style.transform).toBe("");
    expect(style.transformOrigin).toBe("");
  });
});
