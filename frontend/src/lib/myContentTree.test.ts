import { describe, expect, it } from "vitest";
import { UserSubject } from "@/types";
import { insertPageInTree, insertTopicInTree } from "./myContentTree";

const notebook = (id = "nb1"): UserSubject => ({
  id,
  name: "Economics",
  slug: "econ",
  icon: "book",
  order: 0,
  topicGroups: [
    {
      id: "tg1",
      title: "Macro",
      slug: "macro",
      order: 0,
      pages: [],
    },
  ],
  pages: [],
});

describe("insertPageInTree", () => {
  it("adds a notebook-level page without touching other notebooks", () => {
    const page = {
      id: "p1",
      title: "Notes",
      slug: "notes",
      status: "PUBLISHED",
      order: 0,
    };
    const tree = insertPageInTree([notebook(), notebook("nb2")], page, "nb1");
    expect(tree[0]!.pages?.map((p) => p.id)).toEqual(["p1"]);
    expect(tree[1]!.pages).toEqual([]);
  });

  it("adds a page under a topic", () => {
    const page = {
      id: "p2",
      title: "GDP",
      slug: "gdp",
      status: "PUBLISHED",
      order: 0,
    };
    const tree = insertPageInTree([notebook()], page, "nb1", "tg1");
    expect(tree[0]!.topicGroups[0]!.pages.map((p) => p.id)).toEqual(["p2"]);
  });

  it("does not duplicate an existing page", () => {
    const page = {
      id: "p1",
      title: "Notes",
      slug: "notes",
      status: "PUBLISHED",
      order: 0,
    };
    const once = insertPageInTree([notebook()], page, "nb1");
    const twice = insertPageInTree(once, page, "nb1");
    expect(twice[0]!.pages).toHaveLength(1);
  });
});

describe("insertTopicInTree", () => {
  it("appends a topic to the matching notebook", () => {
    const tree = insertTopicInTree([notebook()], "nb1", {
      id: "tg2",
      title: "Micro",
      slug: "micro",
      order: 1,
      pages: [],
    });
    expect(tree[0]!.topicGroups.map((g) => g.id)).toEqual(["tg1", "tg2"]);
  });
});
