import { describe, expect, it } from "vitest";
import {
  blankCanvasScrollTarget,
  canvasBgIsDark,
  isBlankCanvasHtml,
  isEmptyBoxHtml,
  pointsToPath,
  readCanvasBg,
  serializeBlankCanvas,
} from "./blankCanvas";

describe("blankCanvas", () => {
  it("serializes text boxes and strokes together", () => {
    const html = serializeBlankCanvas(
      4800,
      6400,
      [
        {
          id: "tb-a",
          x: 2200,
          y: 3000,
          w: 400,
          html: "<p>Hello notes</p>",
        },
      ],
      [
        {
          d: "M 2100.0 3100.0 L 2300.0 3120.0",
          color: "#dc2626",
          width: 4,
        },
      ]
    );
    expect(html).toContain('class="shelf-blank-canvas"');
    expect(html).toContain('class="shelf-text-box"');
    expect(html).toContain("<p>Hello notes</p>");
    expect(html).toContain('class="blank-draw-layer"');
    expect(html).toContain('stroke="#dc2626"');
    expect(html).toContain("M 2100.0 3100.0 L 2300.0 3120.0");
    expect(html).toContain('data-bg="#0c0c0d"');
    expect(html).toContain("background-color: #0c0c0d");
    expect(html).toContain('data-bg-tone="dark"');
  });

  it("stores a light canvas fill when chosen", () => {
    const html = serializeBlankCanvas(4800, 6400, [], [], "#ffffff");
    expect(html).toContain('data-bg="#ffffff"');
    expect(html).toContain('data-bg-tone="light"');
    expect(readCanvasBg(html)).toBe("#ffffff");
    expect(canvasBgIsDark("#ffffff")).toBe(false);
    expect(canvasBgIsDark("#0c0c0d")).toBe(true);
  });

  it("pans the viewport to ink instead of the empty origin", () => {
    const html = serializeBlankCanvas(
      4800,
      6400,
      [{ id: "tb-a", x: 2200, y: 3000, w: 400, html: "<p>Hi</p>" }],
      [{ d: pointsToPath([{ x: 2300, y: 3180 }, { x: 2400, y: 3200 }]), color: "#2563eb", width: 2.5 }]
    );
    const pan = blankCanvasScrollTarget(html, 800, 600);
    expect(pan).not.toBeNull();
    expect(pan!.left).toBeGreaterThan(1400);
    expect(pan!.top).toBeGreaterThan(2400);
    expect(pan!.left).toBeLessThan(4000);
    expect(pan!.top).toBeLessThan(5000);
  });

  it("treats placeholder boxes as empty", () => {
    expect(isEmptyBoxHtml("<p><br></p>")).toBe(true);
    expect(isEmptyBoxHtml("<p>here</p>")).toBe(false);
  });

  it("detects blank canvas pages vs imported HTML", () => {
    const canvas = serializeBlankCanvas(4800, 6400, [], []);
    expect(isBlankCanvasHtml(canvas)).toBe(true);
    expect(isBlankCanvasHtml("<p>Imported notes</p>")).toBe(false);
  });

  it("defaults missing canvas fill to black", () => {
    expect(readCanvasBg('<div class="shelf-blank-canvas"></div>')).toBe(
      "#0c0c0d"
    );
  });
});
