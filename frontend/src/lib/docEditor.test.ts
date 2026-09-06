import { describe, expect, it } from "vitest";
import {
  createDocHtml,
  ensureReadOnlyDocHtml,
  isCurriculumReadOnlyHtml,
  isDocEditorHtml,
  isLiveDocEditorHtml,
  isReadOnlyDocHtml,
  parseDocBody,
  serializeDocBody,
  wrapAsReadOnlyDocHtml,
} from "./docEditor";

describe("docEditor", () => {
  it("creates and detects live doc HTML", () => {
    const html = createDocHtml("My Notes");
    expect(isDocEditorHtml(html)).toBe(true);
    expect(isLiveDocEditorHtml(html)).toBe(true);
    expect(isReadOnlyDocHtml(html)).toBe(false);
    expect(isCurriculumReadOnlyHtml(html)).toBe(false);
  });

  it("round-trips doc body", () => {
    const inner = "<h1>Title</h1><p>Hello</p>";
    const html = serializeDocBody(inner);
    expect(parseDocBody(html)).toBe(inner);
  });

  it("wraps generated curriculum HTML as a read-only Doc", () => {
    const raw = `<article class="shelf-generated"><p>Hi</p></article>`;
    const wrapped = ensureReadOnlyDocHtml(raw);
    expect(isReadOnlyDocHtml(wrapped)).toBe(true);
    expect(isLiveDocEditorHtml(wrapped)).toBe(false);
    expect(isCurriculumReadOnlyHtml(wrapped)).toBe(true);
    expect(wrapAsReadOnlyDocHtml(wrapped)).toBe(wrapped);
  });
});
