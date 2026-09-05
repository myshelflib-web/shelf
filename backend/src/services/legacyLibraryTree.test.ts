import { describe, expect, it } from "vitest";
import {
  buildLegacySubjectTree,
  orderSubjectsByIds,
} from "./legacyLibraryTree.js";

describe("buildLegacySubjectTree", () => {
  it("maps root folders and one nested level to legacy subject shape", () => {
    const folders = [
      {
        id: "root1",
        name: "Polity",
        slug: "polity",
        description: null,
        icon: "📁",
        order: 1,
        parentId: null,
      },
      {
        id: "nested1",
        name: "Rights",
        slug: "rights",
        description: null,
        icon: "📁",
        order: 1,
        parentId: "root1",
      },
    ];
    const files = [
      {
        id: "f1",
        title: "Root file",
        slug: "root-file",
        status: "PUBLISHED",
        order: 1,
        completed: false,
        starred: false,
        contentType: "PDF" as const,
        folderId: "root1",
      },
      {
        id: "f2",
        title: "Nested file",
        slug: "nested-file",
        status: "PUBLISHED",
        order: 1,
        completed: false,
        starred: false,
        contentType: "PDF" as const,
        folderId: "nested1",
      },
    ];

    const tree = buildLegacySubjectTree(folders, files);
    expect(tree).toHaveLength(1);
    expect(tree[0]?.pages).toHaveLength(1);
    expect(tree[0]?.topicGroups).toHaveLength(1);
    expect(tree[0]?.topicGroups[0]?.pages).toHaveLength(1);
  });

  it("nests folders beyond two levels under children", () => {
    const folders = [
      {
        id: "root1",
        name: "Polity",
        slug: "polity",
        description: null,
        icon: "📁",
        order: 1,
        parentId: null,
      },
      {
        id: "nested1",
        name: "Rights",
        slug: "rights",
        description: null,
        icon: "📁",
        order: 1,
        parentId: "root1",
      },
      {
        id: "deep1",
        name: "Articles",
        slug: "articles",
        description: null,
        icon: "📁",
        order: 1,
        parentId: "nested1",
      },
    ];
    const files = [
      {
        id: "f3",
        title: "Art 14",
        slug: "art-14",
        status: "PUBLISHED",
        order: 1,
        completed: false,
        starred: false,
        contentType: "PDF" as const,
        folderId: "deep1",
      },
    ];

    const tree = buildLegacySubjectTree(folders, files);
    expect(tree[0]?.topicGroups[0]?.children?.[0]?.id).toBe("deep1");
    expect(tree[0]?.topicGroups[0]?.children?.[0]?.pages).toHaveLength(1);
  });
});

describe("orderSubjectsByIds", () => {
  it("preserves browse/sort id order instead of manual folder order", () => {
    const folders = [
      {
        id: "a",
        name: "Alpha",
        slug: "alpha",
        description: null,
        icon: "📁",
        order: 1,
        parentId: null,
      },
      {
        id: "z",
        name: "Zulu",
        slug: "zulu",
        description: null,
        icon: "📁",
        order: 2,
        parentId: null,
      },
    ];
    const tree = buildLegacySubjectTree(folders, []);
    expect(tree.map((s) => s.id)).toEqual(["a", "z"]);
    expect(orderSubjectsByIds(tree, ["z", "a"]).map((s) => s.id)).toEqual([
      "z",
      "a",
    ]);
  });
});
