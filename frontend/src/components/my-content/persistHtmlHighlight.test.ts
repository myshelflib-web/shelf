import { describe, expect, it } from "vitest";
import { PEN_WIDTHS } from "@/lib/straightenStroke";
import { textHighlightDraft } from "./persistHtmlHighlight";

describe("textHighlightDraft", () => {
  it("saves an XS horizontal highlighter stroke from the selection", () => {
    const draft = textHighlightDraft(
      "page-1",
      {
        text: "Hello world",
        rect: { top: 0, left: 0, width: 10, height: 10 } as DOMRect,
        startOffset: 0,
        endOffset: 11,
        position: { rects: [{ x: 0.1, y: 0.2, w: 0.4, h: 0.04 }] },
      },
      "yellow"
    );
    expect(draft.kind).toBe("TEXT");
    expect(draft.position?.tool).toBe("highlight");
    expect(draft.position?.width).toBe(
      PEN_WIDTHS.find((s) => s.id === "xs")?.width
    );
    expect(draft.position?.rects).toEqual([
      { x: 0.1, y: 0.2, w: 0.4, h: 0.04 },
    ]);
  });
});
