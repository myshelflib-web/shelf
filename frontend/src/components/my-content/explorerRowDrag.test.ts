import { describe, expect, it } from "vitest";
import { beforeIdForPlace } from "./explorerRowDrag";

describe("beforeIdForPlace", () => {
  it("returns the hovered id when placing before", () => {
    expect(beforeIdForPlace(["a", "b", "c"], "b", "before")).toBe("b");
  });

  it("returns the next id when placing after a middle item", () => {
    expect(beforeIdForPlace(["a", "b", "c"], "b", "after")).toBe("c");
  });

  it("returns null when placing after the last item", () => {
    expect(beforeIdForPlace(["a", "b", "c"], "c", "after")).toBeNull();
  });
});
