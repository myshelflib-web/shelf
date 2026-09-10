import { describe, expect, it } from "vitest";
import {
  filterThreads,
  groupThreadsByDate,
  isThreadPinned,
} from "@/lib/studyAiThreadGroups";
import type { ChatThreadSummary } from "@/types";

function thread(
  partial: Partial<ChatThreadSummary> & Pick<ChatThreadSummary, "id" | "title">
): ChatThreadSummary {
  return {
    createdAt: "2026-09-10T10:00:00.000Z",
    updatedAt: "2026-09-10T10:00:00.000Z",
    ...partial,
  };
}

describe("studyAiThreadGroups", () => {
  it("marks pinnedAt as pinned", () => {
    expect(isThreadPinned(thread({ id: "1", title: "A", pinnedAt: null }))).toBe(
      false
    );
    expect(
      isThreadPinned(
        thread({ id: "2", title: "B", pinnedAt: "2026-09-11T01:00:00.000Z" })
      )
    ).toBe(true);
  });

  it("puts pinned chats in a Pinned group first", () => {
    const groups = groupThreadsByDate([
      thread({
        id: "old",
        title: "Old",
        updatedAt: "2026-09-11T08:00:00.000Z",
      }),
      thread({
        id: "pin",
        title: "Pinned",
        pinnedAt: "2026-09-11T09:00:00.000Z",
        updatedAt: "2026-09-01T08:00:00.000Z",
      }),
    ]);
    expect(groups[0]?.label).toBe("Pinned");
    expect(groups[0]?.threads.map((t) => t.id)).toEqual(["pin"]);
    expect(groups.some((g) => g.threads.some((t) => t.id === "old"))).toBe(true);
  });

  it("filters by title", () => {
    const list = [
      thread({ id: "1", title: "Polity notes" }),
      thread({ id: "2", title: "Math drill" }),
    ];
    expect(filterThreads(list, "pol").map((t) => t.id)).toEqual(["1"]);
  });
});
