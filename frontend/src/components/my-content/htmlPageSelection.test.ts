import { describe, expect, it } from "vitest";
import { normRectsFromClient } from "./htmlPageSelection";

describe("normRectsFromClient", () => {
  it("converts client boxes to wrap fractions like a PDF page", () => {
    const wrap = { left: 100, top: 50, width: 200, height: 400 };
    const rects = normRectsFromClient(wrap, [
      { left: 120, top: 90, width: 80, height: 20 },
    ]);
    expect(rects).toEqual([{ x: 0.1, y: 0.1, w: 0.4, h: 0.05 }]);
  });

  it("merges boxes on the same line", () => {
    const wrap = { left: 0, top: 0, width: 100, height: 100 };
    const rects = normRectsFromClient(wrap, [
      { left: 10, top: 10, width: 20, height: 8 },
      { left: 32, top: 11, width: 18, height: 8 },
    ]);
    expect(rects).toHaveLength(1);
    expect(rects[0]!.x).toBeCloseTo(0.1);
    expect(rects[0]!.w).toBeCloseTo(0.4);
  });
});
