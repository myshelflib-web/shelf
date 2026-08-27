import { describe, expect, it } from "vitest";
import { reorderBefore } from "./libraryReorder.js";

describe("library move ordering", () => {
  it("inserts page before target in destination list", () => {
    expect(reorderBefore(["a", "b", "c"], "x", "b")).toEqual(["a", "x", "b", "c"]);
  });

  it("appends when target is null", () => {
    expect(reorderBefore(["a", "b"], "x", null)).toEqual(["a", "b", "x"]);
  });
});
