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
        },
      ],
    });
    expect(html).toContain('data-template="grid"');
    expect(html).toContain("blank-draw-stroke");
  });
});
