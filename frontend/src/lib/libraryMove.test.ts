import { describe, expect, it } from "vitest";
import { movePageInTree, moveTopicInTree } from "./libraryMove";
import type { UserPageSummary, UserSubject, UserTopicGroup } from "@/types";

const page = (id: string, title: string): UserPageSummary => ({
  id,
  title,
  slug: id,
  status: "PUBLISHED",
  order: 1,
  completed: false,
  starred: false,
  contentType: "PDF",
});

describe("movePageInTree", () => {
  it("moves a page from root into a collection topic", () => {
    const subjects: UserSubject[] = [
      {
        id: "s1",
        name: "Math",
        slug: "math",
        icon: "📁",
        order: 1,
        topicGroups: [
          {
            id: "g1",
            title: "Algebra",
            slug: "algebra",
            order: 1,
            pages: [page("p2", "Two")],
          },
        ],
        pages: [],
      },
    ];
    const rootPages = [page("p1", "One")];

    const result = movePageInTree(subjects, rootPages, "p1", {
      subjectId: "s1",
      topicGroupId: "g1",
      beforePageId: null,
      page: page("p1", "One"),
    });

    expect(result.rootPages).toHaveLength(0);
    expect(result.subjects[0].topicGroups?.[0].pages.map((p) => p.id)).toEqual([
      "p2",
      "p1",
    ]);
  });
});

describe("moveTopicInTree", () => {
  const folder = (
    id: string,
    title: string,
    children: UserTopicGroup[] = []
  ): UserTopicGroup => ({
    id,
    title,
    slug: id,
    order: 1,
    pages: [],
    children,
  });

  it("nests a folder under another folder in the same collection", () => {
    const moving = folder("g2", "Nested");
    const subjects: UserSubject[] = [
      {
        id: "s1",
        name: "Math",
        slug: "math",
        icon: "📁",
        order: 1,
        topicGroups: [folder("g1", "Algebra"), moving],
        pages: [],
      },
    ];

    const result = moveTopicInTree(
      subjects,
      "g2",
      "s1",
      moving,
      null,
      "g1"
    );

    expect(result[0].topicGroups.map((g) => g.id)).toEqual(["g1"]);
    expect(result[0].topicGroups[0].children?.map((g) => g.id)).toEqual(["g2"]);
  });
});
