import { describe, expect, it } from "vitest";
import { buildLegacySubjectTree } from "./legacyLibraryTree.js";

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
});
