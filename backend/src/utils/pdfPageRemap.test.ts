import { describe, expect, it } from "vitest";
import {
  normalizeDeletedPages,
  remapPageNumberAfterDeletes,
} from "./pdfPageRemap.js";

describe("remapPageNumberAfterDeletes", () => {
  it("returns null for deleted pages", () => {
    expect(remapPageNumberAfterDeletes(2, [2, 5])).toBeNull();
  });

  it("shifts pages after deletions", () => {
    expect(remapPageNumberAfterDeletes(1, [2, 4])).toBe(1);
    expect(remapPageNumberAfterDeletes(3, [2, 4])).toBe(2);
    expect(remapPageNumberAfterDeletes(5, [2, 4])).toBe(3);
  });
});

describe("normalizeDeletedPages", () => {
  it("dedupes and sorts valid pages", () => {
    expect(normalizeDeletedPages([3, 1, 3, 2], 5)).toEqual([1, 2, 3]);
  });

  it("rejects deleting every page", () => {
    expect(normalizeDeletedPages([1, 2], 2)).toBeNull();
  });

  it("rejects empty or out of range", () => {
    expect(normalizeDeletedPages([], 5)).toBeNull();
    expect(normalizeDeletedPages([0, 99], 5)).toBeNull();
  });
});
