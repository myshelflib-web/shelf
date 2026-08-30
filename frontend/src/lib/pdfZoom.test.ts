import { describe, expect, it } from "vitest";
import {
  PDF_SCALE_MAX,
  PDF_SCALE_MIN,
  applyPdfVisualZoom,
  capturePdfZoomAnchorFromBoxes,
  clearPdfVisualZoom,
  clampPdfScale,
  isPdfPinch,
  isPdfZoomWheel,
  nextPdfPinchScale,
  nextPdfWheelScale,
  nextPdfZoomScroll,
  pdfPinchCentre,
  pdfPinchDistance,
  pdfPinchFingers,
  pdfVisualZoomOrigin,
  pickPdfZoomPage,
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
  const page1 = { page: 1, left: 40, top: 80, width: 200, height: 280 };
  const page2 = { page: 2, left: 40, top: 384, width: 200, height: 280 };

  it("picks the sheet under the cursor", () => {
    expect(pickPdfZoomPage([page1, page2], 100, 200)?.page).toBe(1);
    expect(pickPdfZoomPage([page1, page2], 100, 420)?.page).toBe(2);
  });

  it("picks the nearest sheet when the cursor is in the gap", () => {
    expect(pickPdfZoomPage([page1, page2], 100, 378)?.page).toBe(2);
  });

  it("records the page-local point, not a scaled scrollTop", () => {
    const anchor = capturePdfZoomAnchorFromBoxes(0, 0, [page1, page2], 140, 220);
    expect(anchor).toEqual({
      page: 1,
      fracX: 0.5,
      fracY: 0.5,
      cursorX: 140,
      cursorY: 220,
    });
  });

  it("keeps that page point under the cursor after sheets grow", () => {
    const anchor = capturePdfZoomAnchorFromBoxes(0, 0, [page1, page2], 140, 220);
    expect(anchor).not.toBeNull();
    const grown = { page: 1, left: 20, top: 200, width: 400, height: 560 };
    const next = nextPdfZoomScroll(
      grown,
      { left: 0, top: 0, scrollLeft: 0, scrollTop: 120 },
      anchor!
    );
    expect(next.scrollLeft).toBe(grown.left + 0.5 * grown.width - 140);
    expect(next.scrollTop).toBe(120 + (grown.top + 0.5 * grown.height - 220));
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

describe("pdf pinch fingers", () => {
  it("ignores Apple Pencil stylus contacts", () => {
    const fingers = pdfPinchFingers([
      { clientX: 10, clientY: 20, touchType: "stylus" },
      { clientX: 40, clientY: 80 },
      { clientX: 80, clientY: 120, touchType: "direct" },
    ]);
    expect(fingers).toHaveLength(2);
    expect(fingers[0]?.clientX).toBe(40);
    expect(fingers[1]?.clientX).toBe(80);
  });

  it("measures span and midpoint between two fingers", () => {
    const a = { clientX: 0, clientY: 0 };
    const b = { clientX: 30, clientY: 40 };
    expect(pdfPinchDistance(a, b)).toBe(50);
    expect(pdfPinchCentre(a, b)).toEqual({ x: 15, y: 20 });
  });
});

describe("pdf pinch scale", () => {
  it("ignores small spread changes so two-finger pan does not zoom", () => {
    expect(isPdfPinch(100, 105)).toBe(false);
    expect(isPdfPinch(100, 88)).toBe(true);
    expect(isPdfPinch(100, 120)).toBe(true);
  });

  it("scales from the span at pinch start and stays in range", () => {
    expect(nextPdfPinchScale(1, 100, 150)).toBe(1.5);
    expect(nextPdfPinchScale(1, 100, 50)).toBe(0.5);
    expect(nextPdfPinchScale(1, 100, 400)).toBe(PDF_SCALE_MAX);
    expect(nextPdfPinchScale(1, 0, 50)).toBe(1);
  });
});
