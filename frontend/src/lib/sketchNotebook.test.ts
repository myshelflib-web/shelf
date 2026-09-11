import { describe, expect, it } from "vitest";
import {
  createSketchNotebookHtml,
  isSketchNotebookHtml,
  parseSketchNotebook,
  serializeSketchNotebook,
} from "./sketchNotebook";

describe("sketchNotebook", () => {
  it("creates sketch notebook with one ruled page", () => {
    const html = createSketchNotebookHtml({ bg: "#ffffff", template: "ruled" });
    expect(isSketchNotebookHtml(html)).toBe(true);
    expect(html).toContain('data-template="ruled"');
    expect(html).toContain('data-bg="#ffffff"');
    expect(html).toContain("shelf-sketch-notebook");
  });

  it("serializes grid template and ink paths", () => {
    const html = serializeSketchNotebook({
      activeIndex: 0,
      pages: [
        {
          index: 0,
          bg: "#f4f1ea",
          template: "grid",
          paths: [
            {
              d: "M 10.0 20.0 L 30.0 40.0",
              color: "#dc2626",
              width: 3,
            },
          ],
          images: [],
        },
      ],
    });
    expect(html).toContain('data-template="grid"');
    expect(html).toContain("blank-draw-stroke");
  });

  it("serializes pasted images on a page", () => {
    const html = serializeSketchNotebook({
      activeIndex: 0,
      pages: [
        {
          index: 0,
          bg: "#ffffff",
          template: "blank",
          paths: [],
          images: [
            {
              id: "img-a1",
              src: "data:image/jpeg;base64,/9j/4AAQ",
              x: 40,
              y: 60,
              w: 200,
              h: 150,
            },
          ],
        },
      ],
    });
    expect(html).toContain("shelf-sketch-image");
    expect(html).toContain('data-id="img-a1"');
    expect(html).toContain('data-w="200"');
    expect(html).toContain("left:40px;top:60px;width:200px;height:150px");
  });
});
