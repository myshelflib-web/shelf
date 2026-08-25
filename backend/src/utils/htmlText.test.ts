import { describe, expect, it } from "vitest";
import { htmlToPlainText, truncateText } from "./htmlText.js";

describe("htmlToPlainText", () => {
  it("strips tags and collapses whitespace", () => {
    expect(htmlToPlainText("<h2>Hello</h2><p>world &amp; you</p>")).toBe(
      "Hello world & you"
    );
  });
});

describe("truncateText", () => {
  it("keeps short text", () => {
    expect(truncateText("abc", 10)).toBe("abc");
  });

  it("truncates long text", () => {
    expect(truncateText("abcdefghij", 5)).toBe("abcde…");
  });
});
