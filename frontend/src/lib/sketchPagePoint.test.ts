import { describe, expect, it } from "vitest";
import { SKETCH_PAGE_H, SKETCH_PAGE_W } from "./sketchNotebook";
import { clientToSketchPoint } from "./sketchPagePoint";

function box(left: number, top: number, width: number, height: number) {
  return { getBoundingClientRect: () => ({ left, top, width, height }) };
}

describe("clientToSketchPoint", () => {
  it("maps the top-left of an unscaled sheet", () => {
    expect(clientToSketchPoint(box(10, 20, SKETCH_PAGE_W, SKETCH_PAGE_H), 10, 20)).toEqual({
      x: 0,
      y: 0,
    });
  });

  it("maps the same sheet point when the page is zoomed 2x", () => {
    const pt = clientToSketchPoint(
      box(0, 0, SKETCH_PAGE_W * 2, SKETCH_PAGE_H * 2),
      SKETCH_PAGE_W,
      SKETCH_PAGE_H
    );
    expect(pt.x).toBeCloseTo(SKETCH_PAGE_W / 2);
    expect(pt.y).toBeCloseTo(SKETCH_PAGE_H / 2);
  });

  it("stays in page space during a pinch CSS scale", () => {
    const pt = clientToSketchPoint(box(40, 80, 397, 561.5), 40 + 198.5, 80 + 280.75);
    expect(pt.x).toBeCloseTo(SKETCH_PAGE_W / 2, 0);
    expect(pt.y).toBeCloseTo(SKETCH_PAGE_H / 2, 0);
  });
});
