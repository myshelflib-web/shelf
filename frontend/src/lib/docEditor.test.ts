import { describe, expect, it } from "vitest";
import { createDocHtml, isDocEditorHtml, parseDocBody, serializeDocBody } from "./docEditor";

describe("docEditor", () => {
  it("creates and detects doc HTML", () => {
    const html = createDocHtml("My Notes");
    expect(isDocEditorHtml(html)).toBe(true);
    expect(html).toContain("shelf-doc-editor");
    expect(html).toContain("<h1>My Notes</h1>");
  });

  it("round-trips doc body", () => {
    const inner = "<h1>Title</h1><p>Hello</p>";
    const html = serializeDocBody(inner);
    expect(parseDocBody(html)).toBe(inner);
  });
});
