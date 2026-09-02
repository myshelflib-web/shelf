import { describe, expect, it, beforeEach } from "vitest";
import {
  getPendingExplorerDeletes,
  mergeExplorerTreeWithPending,
  pushPendingExplorerDelete,
  resetPendingExplorerDeletesForTests,
} from "./pendingExplorerDeletes";
import type { UserPageSummary, UserSubject } from "@/types";

const page = (id: string): UserPageSummary => ({
  id,
  title: id,
  slug: id,
  status: "PUBLISHED",
  order: 1,
});

const subject = (id: string, pageIds = ["p1", "p2"]): UserSubject => ({
  id,
  name: id,
  slug: id,
  icon: "📁",
  order: 1,
  topicGroups: [],
  pages: pageIds.map(page),
});

describe("pendingExplorerDeletes", () => {
  beforeEach(() => {
    resetPendingExplorerDeletesForTests();
  });

  it("keeps deleted ids hidden across refetches until the server catches up", () => {
    const payload = {
      subjectIds: [] as string[],
      topicGroups: [] as { subjectId: string; groupId: string }[],
      pageIds: ["p1", "root"],
    };
    pushPendingExplorerDelete(payload);

    const merged = mergeExplorerTreeWithPending(
      [subject("s1")],
      [page("root"), page("other")]
    );

    expect(merged.rootPages.map((entry) => entry.id)).toEqual(["other"]);
    expect(merged.subjects[0]?.pages?.map((entry) => entry.id)).toEqual(["p2"]);
    expect(getPendingExplorerDeletes()).toHaveLength(1);
  });

  it("drops pending only after the server no longer returns deleted ids", () => {
    const payload = {
      subjectIds: [] as string[],
      topicGroups: [] as { subjectId: string; groupId: string }[],
      pageIds: ["p1"],
    };
    pushPendingExplorerDelete(payload);

    mergeExplorerTreeWithPending([subject("s1")], []);
    expect(getPendingExplorerDeletes()).toHaveLength(1);

    mergeExplorerTreeWithPending([subject("s1", ["p2"])], []);
    expect(getPendingExplorerDeletes()).toHaveLength(0);
  });

  it("dedupes identical pending payloads", () => {
    const payload = {
      subjectIds: [] as string[],
      topicGroups: [] as { subjectId: string; groupId: string }[],
      pageIds: ["p1"],
    };
    pushPendingExplorerDelete(payload);
    pushPendingExplorerDelete({ ...payload });

    const merged = mergeExplorerTreeWithPending([subject("s1")], []);
    expect(merged.subjects[0]?.pages?.map((entry) => entry.id)).toEqual(["p2"]);
    expect(getPendingExplorerDeletes()).toHaveLength(1);
  });
});
