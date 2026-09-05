import { describe, expect, it } from "vitest";
import { tabFromScope } from "@/components/my-content/reader/types";
import { learnScope } from "@/lib/learnContent";
import {
  activatePreloadedTab,
  activePreloadedTab,
  closePreloadedTab,
  emptyPreloadedOpenFiles,
  openPreloadedTab,
  reorderPreloadedTabs,
  tabFromLearnHref,
} from "./preloadedOpenFiles";

function tab(article: string, title = article) {
  return tabFromScope(learnScope("upsc-polity", "constitution", article), title);
}

describe("preloadedOpenFiles", () => {
  it("parses a learn article href into a tab", () => {
    const parsed = tabFromLearnHref(
      "/learn/upsc-polity/constitution/preamble",
      "Preamble"
    );
    expect(parsed?.href).toBe("/learn/upsc-polity/constitution/preamble");
    expect(parsed?.title).toBe("Preamble");
    expect(tabFromLearnHref("/learn/upsc-polity")).toBeNull();
  });

  it("opens a second file as another tab instead of replacing", () => {
    const first = openPreloadedTab(emptyPreloadedOpenFiles(), tab("preamble"));
    const second = openPreloadedTab(first, tab("dpsp", "DPSP"));
    expect(second.tabs.map((t) => t.scope.kind === "learn" ? t.scope.articleSlug : "")).toEqual([
      "preamble",
      "dpsp",
    ]);
    expect(activePreloadedTab(second)?.title).toBe("DPSP");
  });

  it("activates an already-open file instead of duplicating it", () => {
    const opened = openPreloadedTab(
      openPreloadedTab(emptyPreloadedOpenFiles(), tab("preamble")),
      tab("dpsp")
    );
    const again = openPreloadedTab(opened, tab("preamble", "Preamble"));
    expect(again.tabs).toHaveLength(2);
    expect(activePreloadedTab(again)?.scope).toMatchObject({
      articleSlug: "preamble",
    });
  });

  it("returns to an empty set when the last tab closes", () => {
    const one = openPreloadedTab(emptyPreloadedOpenFiles(), tab("preamble"));
    expect(closePreloadedTab(one, one.tabs[0]!.key)).toEqual(
      emptyPreloadedOpenFiles()
    );
  });

  it("activates a neighbor when closing the focused tab", () => {
    const two = openPreloadedTab(
      openPreloadedTab(emptyPreloadedOpenFiles(), tab("a")),
      tab("b")
    );
    const after = closePreloadedTab(two, two.activeKey!);
    expect(after.tabs).toHaveLength(1);
    expect(activePreloadedTab(after)?.scope).toMatchObject({ articleSlug: "a" });
    expect(activatePreloadedTab(after, "missing")).toBe(after);
  });

  it("reorders open tabs without changing the active key", () => {
    const two = openPreloadedTab(
      openPreloadedTab(emptyPreloadedOpenFiles(), tab("a")),
      tab("b")
    );
    const aKey = two.tabs[0]!.key;
    const bKey = two.tabs[1]!.key;
    const moved = reorderPreloadedTabs(two, bKey, aKey, "before");
    expect(moved.tabs.map((t) => t.key)).toEqual([bKey, aKey]);
    expect(moved.activeKey).toBe(bKey);
    expect(reorderPreloadedTabs(moved, bKey, bKey, "after")).toBe(moved);
  });
});
