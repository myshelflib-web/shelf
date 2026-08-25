import { describe, expect, it } from "vitest";
import {
  DEFAULT_INK_WIDTH,
  DEFAULT_PEN_WIDTH,
  INK_WIDTHS,
  PEN_WIDTHS,
  penCursorPx,
  penStrokeWidthPx,
  straightenStroke,
} from "./straightenStroke";

describe("straightenStroke", () => {
  it("snaps a mostly horizontal stroke to a horizontal line", () => {
    const points = [
      { x: 0.1, y: 0.5 },
      { x: 0.2, y: 0.52 },
      { x: 0.4, y: 0.48 },
      { x: 0.6, y: 0.51 },
    ];
    const out = straightenStroke(points);
    expect(out).toHaveLength(2);
    expect(out[0].y).toBeCloseTo(out[1].y, 5);
    expect(out[0].x).toBeLessThan(out[1].x);
  });

  it("snaps a mostly vertical stroke to a vertical line", () => {
    const points = [
      { x: 0.5, y: 0.1 },
      { x: 0.52, y: 0.25 },
      { x: 0.48, y: 0.45 },
      { x: 0.51, y: 0.7 },
    ];
    const out = straightenStroke(points);
    expect(out).toHaveLength(2);
    expect(out[0].x).toBeCloseTo(out[1].x, 5);
    expect(out[0].y).toBeLessThan(out[1].y);
  });
});

describe("PEN_WIDTHS", () => {
  it("keeps Large at the previous extra-small width", () => {
    expect(PEN_WIDTHS.find((s) => s.id === "l")?.width).toBe(0.005);
    expect(PEN_WIDTHS[0].width).toBeLessThan(0.005);
    expect(DEFAULT_PEN_WIDTH).toBe(PEN_WIDTHS.find((s) => s.id === "m")?.width);
  });

  it("renders Large thinner than the old 3px floor and XS even finer", () => {
    const xs = penStrokeWidthPx(PEN_WIDTHS[0].width);
    const l = penStrokeWidthPx(0.005);
    expect(xs).toBeLessThan(l);
    expect(l).toBeLessThan(3);
    expect(xs).toBeGreaterThanOrEqual(0.6);
  });

  it("maps preset widths to distinct cursor sizes", () => {
    const sizes = PEN_WIDTHS.map((s) => penCursorPx(s.width));
    expect(new Set(sizes).size).toBe(sizes.length);
    expect(penCursorPx(0.005)).toBe(14);
  });
});

describe("INK_WIDTHS", () => {
  it("uses highlighter XS as ink medium", () => {
    expect(INK_WIDTHS.find((s) => s.id === "m")?.width).toBe(
      PEN_WIDTHS.find((s) => s.id === "xs")?.width
    );
    expect(DEFAULT_INK_WIDTH).toBe(INK_WIDTHS.find((s) => s.id === "m")?.width);
  });

  it("keeps ink presets visually distinct and thinner than highlighter", () => {
    const ink = INK_WIDTHS.map((s) => penStrokeWidthPx(s.width));
    expect(new Set(ink).size).toBe(ink.length);
    expect(ink[0]).toBeLessThan(ink[2]);
    expect(penStrokeWidthPx(DEFAULT_INK_WIDTH)).toBeLessThan(
      penStrokeWidthPx(DEFAULT_PEN_WIDTH)
    );
  });
});
