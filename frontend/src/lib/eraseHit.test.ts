import { describe, expect, it } from "vitest";
import {
  parseSvgPathPoints,
  polylineHitsPoint,
  rectHitsPoint,
} from "./eraseHit";

describe("eraseHit", () => {
  it("parses M/L path points", () => {
    expect(parseSvgPathPoints("M 10.0 20.0 L 30.0 40.0")).toEqual([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ]);
  });

  it("hits a polyline near the stroke", () => {
    const line = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ];
    expect(polylineHitsPoint(line, { x: 5, y: 0.2 }, 0.5)).toBe(true);
    expect(polylineHitsPoint(line, { x: 5, y: 2 }, 0.5)).toBe(false);
  });

  it("hits a padded rect", () => {
    const box = { x: 10, y: 10, w: 20, h: 8 };
    expect(rectHitsPoint(box, { x: 12, y: 12 })).toBe(true);
    expect(rectHitsPoint(box, { x: 8, y: 12 }, 3)).toBe(true);
    expect(rectHitsPoint(box, { x: 50, y: 12 })).toBe(false);
  });
});
