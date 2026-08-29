import { describe, expect, it } from "vitest";
import type { UserPageSummary, UserSubject } from "@/types";
import {
  clipTargetLabel,
  clipTargetsFromRootPages,
  clipTargetsFromSubject,
  groupClipTargets,
  isClipNotePage,
  mergeClipTargets,
} from "./clipSaveTargets";

function page(
  id: string,
  title: string,
  contentType?: UserPageSummary["contentType"]
): UserPageSummary {
  return { id, title, slug: id, status: "PUBLISHED", order: 1, contentType };
}

describe("isClipNotePage", () => {
  it("allows notes and unknown types, not PDFs or links", () => {
    expect(isClipNotePage(page("1", "Doc", "HTML"))).toBe(true);
    expect(isClipNotePage(page("2", "Sketch"))).toBe(true);
    expect(isClipNotePage(page("3", "Paper", "PDF"))).toBe(false);
    expect(isClipNotePage(page("5", "Lecture", "VIDEO"))).toBe(true);
  });
});

describe("clip target collection", () => {
  it("pulls collection and topic note pages", () => {
    const nb = {
      id: "n1",
      name: "UPSC",
      slug: "upsc",
      icon: "book",
      order: 1,
      pages: [page("a", "Notes", "HTML"), page("b", "Paper", "PDF")],
      topicGroups: [
        {
          id: "g1",
          title: "GS",
          slug: "gs",
          order: 1,
          pages: [page("c", "Essay", "HTML")],
        },
      ],
    } as UserSubject;
    const targets = clipTargetsFromSubject(nb);
    expect(targets.map((t) => t.id)).toEqual(["a", "c"]);
    expect(clipTargetLabel(targets[1])).toBe("GS / Essay");
  });

  it("merges without duplicates and groups by collection", () => {
    const a = clipTargetsFromRootPages([page("r", "Inbox", "HTML")]);
    const b = clipTargetsFromRootPages([
      page("r", "Inbox", "HTML"),
      page("s", "More", "HTML"),
    ]);
    const merged = mergeClipTargets(a, b);
    expect(merged.map((t) => t.id)).toEqual(["r", "s"]);
    expect(groupClipTargets(merged)).toHaveLength(1);
  });
});
