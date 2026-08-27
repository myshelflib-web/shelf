import { describe, expect, it } from "vitest";
import { mergeReorder } from "./libraryReorder.js";

describe("mergeReorder", () => {
  it("inserts reordered subset at the first original position", () => {
    expect(mergeReorder(["a", "b", "c", "d", "e"], ["d", "b", "c"])).toEqual([
      "a",
      "d",
      "b",
      "c",
      "e",
    ]);
  });

  it("returns all ids when subset is the full list", () => {
    expect(mergeReorder(["a", "b", "c"], ["c", "a", "b"])).toEqual([
      "c",
      "a",
      "b",
    ]);
  });
});
