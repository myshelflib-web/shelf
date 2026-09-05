import { describe, expect, it } from "vitest";
import type { UserContentHighlight } from "@/types";
import type { LocalHighlight } from "./db";
import { keepOptimisticHighlights, mergeHighlightLists } from "./highlightMerge";

const base = (over: Partial<UserContentHighlight>): UserContentHighlight => ({
  id: "h-1",
  userTopicId: "page-1",
  text: "quote",
  startOffset: 0,
  endOffset: 5,
  color: "yellow",
  ...over,
});

describe("mergeHighlightLists", () => {
  it("keeps offline-only highlights", () => {
    const local: LocalHighlight[] = [
      {
        ...base({ id: "local-1" }),
        userId: "u1",
        pageId: "page-1",
        syncStatus: "pending",
        localOnly: true,
        updatedAt: 1,
      },
    ];
    expect(mergeHighlightLists([], local, "page-1")).toHaveLength(1);
  });
});

describe("keepOptimisticHighlights", () => {
  it("keeps tmp marks that the server list has not caught up to", () => {
    const prev = [base({ id: "tmp-1", text: "new" }), base({ id: "h-2" })];
    const incoming = [base({ id: "h-2" })];
    const merged = keepOptimisticHighlights(prev, incoming);
    expect(merged.map((h) => h.id)).toEqual(["h-2", "tmp-1"]);
  });

  it("does not duplicate once the server id is present", () => {
    const prev = [base({ id: "tmp-1" })];
    const incoming = [base({ id: "tmp-1" })];
    expect(keepOptimisticHighlights(prev, incoming)).toEqual(incoming);
  });
});

