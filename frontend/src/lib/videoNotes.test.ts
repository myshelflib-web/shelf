import { describe, expect, it } from "vitest";
import {
  formatVideoTime,
  prependTimestamp,
  secondsFromTimestampHref,
} from "./videoNotes";

describe("formatVideoTime", () => {
  it("formats minutes and hours", () => {
    expect(formatVideoTime(0)).toBe("0:00");
    expect(formatVideoTime(754)).toBe("12:34");
    expect(formatVideoTime(3661)).toBe("1:01:01");
  });
});

describe("prependTimestamp", () => {
  it("inserts a seek link at the start of the doc body", () => {
    const html =
      '<div class="shelf-doc-editor"><div class="shelf-doc-body"><p>hello</p></div></div>';
    const next = prependTimestamp(html, 94);
    expect(next).toContain('href="#t-94"');
    expect(next).toContain("1:34");
    expect(next).toContain("<p>hello</p>");
    expect(secondsFromTimestampHref("#t-94")).toBe(94);
  });
});
