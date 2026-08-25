import { describe, expect, it } from "vitest";
import { slugify } from "./slugify.js";

describe("slugify", () => {
  it("lowercases and hyphenates words", () => {
    expect(slugify("Fundamental Rights")).toBe("fundamental-rights");
  });

  it("trims and strips leading/trailing hyphens", () => {
    expect(slugify("  Hello World!  ")).toBe("hello-world");
  });

  it("collapses non-alphanumeric runs", () => {
    expect(slugify("A---B___C")).toBe("a-b-c");
  });

  it("returns empty string for punctuation-only input", () => {
    expect(slugify("!!!")).toBe("");
  });
});
