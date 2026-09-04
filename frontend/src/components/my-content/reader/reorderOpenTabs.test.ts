import { describe, expect, it } from "vitest";
import { reorderOpenTabs } from "./reorderOpenTabs";
import type { OpenTab } from "./types";

const tab = (key: string): OpenTab => ({
  key,
  href: key,
  title: key,
  scope: { kind: "root-file", pageSlug: key },
});

describe("reorderOpenTabs", () => {
  it("moves before another tab", () => {
    const tabs = [tab("a"), tab("b"), tab("c")];
    expect(
      reorderOpenTabs(tabs, "c", "a", "before")?.map((t) => t.key)
    ).toEqual(["c", "a", "b"]);
  });

  it("moves after another tab", () => {
    const tabs = [tab("a"), tab("b"), tab("c")];
    expect(
      reorderOpenTabs(tabs, "a", "b", "after")?.map((t) => t.key)
    ).toEqual(["b", "a", "c"]);
  });

  it("returns null when unchanged", () => {
    const tabs = [tab("a"), tab("b"), tab("c")];
    expect(reorderOpenTabs(tabs, "a", "a", "before")).toBeNull();
    expect(reorderOpenTabs(tabs, "a", "b", "before")).toBeNull();
  });
});
