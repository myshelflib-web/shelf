import { describe, expect, it } from "vitest";
import {
  createDocHtml,
  ensureReadOnlyDocHtml,
  isDocEditorHtml,
  isLiveDocEditorHtml,
  isReadOnlyDocHtml,
  parseDocBody,
  serializeDocBody,
  wrapAsReadOnlyDocHtml,
} from "./docEditor";

describe("docEditor", () => {
  it("creates and detects doc HTML", () => {
    const html = createDocHtml("My Notes");
    expect(isDocEditorHtml(html)).toBe(true);
    expect(isLiveDocEditorHtml(html)).toBe(true);
    expect(isReadOnlyDocHtml(html)).toBe(false);
    expect(html).toContain("shelf-doc-editor");
    expect(html).toContain("<h1>My Notes</h1>");
  });

  it("round-trips doc body", () => {
    const inner = "<h1>Title</h1><p>Hello</p>";
    const html = serializeDocBody(inner);
    expect(parseDocBody(html)).toBe(inner);
  });

  it("wraps generated curriculum HTML as a read-only Doc", () => {
    const raw = `<!DOCTYPE html><html><body><header class="doc-masthead shelf-doc-masthead"><h1>T</h1></header><article class="shelf-generated"><p>Hi</p></article></body></html>`;
    const wrapped = wrapAsReadOnlyDocHtml(raw);
    expect(isReadOnlyDocHtml(wrapped)).toBe(true);
    expect(isLiveDocEditorHtml(wrapped)).toBe(false);
    expect(wrapped).toContain("shelf-generated");
    expect(wrapped).toContain("shelf-doc-body");
    expect(ensureReadOnlyDocHtml(wrapped)).toBe(wrapped);
  });
});
