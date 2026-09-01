import { describe, expect, it } from "vitest";
import { applyBulkDeleteToTree, mergeExplorerTreeWithPendingDeletes } from "./explorerBulkDeleteTree";
import type { UserPageSummary, UserSubject } from "@/types";

const page = (id: string): UserPageSummary => ({
  id,
  title: id,
  slug: id,
  status: "PUBLISHED",
  order: 1,
});

const subject = (id: string, extras?: Partial<UserSubject>): UserSubject => ({
  id,
  name: id,
  slug: id,
  icon: "📁",
  order: 1,
  topicGroups: [],
  pages: [],
  ...extras,
});

describe("applyBulkDeleteToTree", () => {
  it("removes selected pages and topics", () => {
    const subjects = [
      subject("s1", {
        topicGroups: [
          {
            id: "g1",
            title: "T",
            slug: "t",
            order: 1,
            pages: [page("p1"), page("p2")],
          },
        ],
        pages: [page("p3")],
      }),
    ];
    const rootPages = [page("root")];

    const result = applyBulkDeleteToTree(
      {
        subjectIds: [],
        topicGroups: [{ subjectId: "s1", groupId: "g1" }],
        pageIds: ["root"],
      },
      subjects,
      rootPages
    );

    expect(result.rootPages).toEqual([]);
    expect(result.subjects[0]?.topicGroups).toEqual([]);
    expect(result.subjects[0]?.pages).toEqual([page("p3")]);
  });
});

describe("mergeExplorerTreeWithPendingDeletes", () => {
  it("re-applies in-flight delete payloads after a refetch", () => {
    const subjects = [subject("s1", { pages: [page("p1"), page("p2")] })];
    const rootPages = [page("root")];
    const pending = [
      {
        subjectIds: [] as string[],
        topicGroups: [] as { subjectId: string; groupId: string }[],
        pageIds: ["p1", "root"],
      },
    ];

    const merged = mergeExplorerTreeWithPendingDeletes(subjects, rootPages, pending);

    expect(merged.rootPages).toEqual([]);
    expect(merged.subjects[0]?.pages).toEqual([page("p2")]);
  });
});
