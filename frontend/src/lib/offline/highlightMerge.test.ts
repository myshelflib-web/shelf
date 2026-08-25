import { describe, expect, it } from "vitest";
import type { UserContentHighlight } from "@/types";
import type { LocalHighlight } from "./db";
import { mergeHighlightLists } from "./highlightMerge";

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
