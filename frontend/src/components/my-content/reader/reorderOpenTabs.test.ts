import { describe, expect, it } from "vitest";
import { reorderOpenTabs, tabIndexFromPointerX } from "./reorderOpenTabs";
import type { OpenTab } from "./types";

const tab = (key: string): OpenTab => ({
  key,
  href: key,
  title: key,
  scope: { kind: "root-file", pageSlug: key },
});

describe("reorderOpenTabs", () => {
  it("moves a tab to a new index", () => {
    const tabs = [tab("a"), tab("b"), tab("c")];
    expect(reorderOpenTabs(tabs, "a", 2)?.map((t) => t.key)).toEqual([
      "b",
      "c",
      "a",
    ]);
    expect(reorderOpenTabs(tabs, "c", 0)?.map((t) => t.key)).toEqual([
      "c",
      "a",
      "b",
    ]);
    expect(reorderOpenTabs(tabs, "a", 0)).toBeNull();
  });
});

describe("tabIndexFromPointerX", () => {
  const rects = [
    { key: "a", left: 0, width: 100 },
    { key: "b", left: 100, width: 100 },
    { key: "c", left: 200, width: 100 },
  ];

  it("places before the first midpoint when dragging from the end", () => {
    expect(tabIndexFromPointerX(40, rects, "c")).toBe(0);
  });

  it("places after the last other tab when past its midpoint", () => {
    expect(tabIndexFromPointerX(260, rects, "a")).toBe(2);
  });

  it("places between neighbors", () => {
    expect(tabIndexFromPointerX(160, rects, "a")).toBe(1);
  });
});
