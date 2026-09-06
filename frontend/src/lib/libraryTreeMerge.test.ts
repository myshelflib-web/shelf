import { describe, expect, it } from "vitest";
import {
  mergeListPreservingHydratedTrees,
  subjectTreeLoaded,
} from "./libraryTreeMerge";
import type { UserSubject } from "@/types";

function stub(id: string, slug: string): UserSubject {
  return {
    id,
    name: slug,
    slug,
    icon: "📁",
    order: 1,
    topicGroups: [],
    pages: [],
  };
}

function withPage(base: UserSubject): UserSubject {
  return {
    ...base,
    pages: [
      {
        id: "p1",
        title: "Notes",
        slug: "notes",
        status: "PUBLISHED",
        order: 1,
      },
    ],
  };
}

describe("libraryTreeMerge", () => {
  it("detects loaded trees", () => {
    expect(subjectTreeLoaded(stub("a", "a"))).toBe(false);
    expect(subjectTreeLoaded(withPage(stub("a", "a")))).toBe(true);
  });

  it("preserves hydrated trees across slim list refresh", () => {
    const prev = [withPage(stub("a", "alpha")), stub("b", "beta")];
    const incoming = [stub("a", "alpha"), stub("b", "beta")];
    const merged = mergeListPreservingHydratedTrees(
      incoming,
      prev,
      new Set(["a"])
    );
    expect(merged[0]?.pages).toHaveLength(1);
    expect(merged[1]?.pages).toHaveLength(0);
  });

  it("does not resurrect subjects missing from the refresh", () => {
    const prev = [withPage(stub("a", "alpha"))];
    const incoming = [stub("b", "beta")];
    const merged = mergeListPreservingHydratedTrees(
      incoming,
      prev,
      new Set(["a"])
    );
    expect(merged.map((s) => s.id)).toEqual(["b"]);
  });
});
