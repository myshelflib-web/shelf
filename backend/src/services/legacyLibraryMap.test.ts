import { describe, expect, it } from "vitest";
import { foldersForLegacySubjectIds } from "./legacyLibraryMapHelpers.js";

describe("foldersForLegacySubjectIds", () => {
  const folders = [
    {
      id: "root1",
      name: "Polity",
      slug: "polity",
      description: null,
      icon: "📁",
      order: 1,
      parentId: null as string | null,
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
      id: "root2",
      name: "History",
      slug: "history",
      description: null,
      icon: "📁",
      order: 2,
      parentId: null,
    },
    {
      id: "deep",
      name: "Deep",
      slug: "deep",
      description: null,
      icon: "📁",
      order: 1,
      parentId: "nested1",
    },
  ];

  it("includes nested descendants when loading selected root folders", () => {
    const scoped = foldersForLegacySubjectIds(folders, ["root1"]);
    expect(scoped.map((f) => f.id).sort()).toEqual(
      ["deep", "nested1", "root1"].sort()
    );
  });

  it("returns all folders when ids omitted", () => {
    expect(foldersForLegacySubjectIds(folders).map((f) => f.id)).toEqual(
      folders.map((f) => f.id)
    );
  });
});
