import { describe, expect, it, vi } from "vitest";
import { applyExplorerContentChange } from "./explorerContentChange";
import type { UserPageSummary, UserSubject } from "@/types";

function page(partial: Partial<UserPageSummary> & { id: string }): UserPageSummary {
  return {
    id: partial.id,
    title: partial.title ?? "Page",
    slug: partial.slug ?? "page",
    order: 0,
    contentType: "PDF",
    status: "PUBLISHED",
    completed: partial.completed ?? false,
    starred: partial.starred ?? false,
  };
}

describe("applyExplorerContentChange page-flags", () => {
  it("updates root and nested pages for star and completed", () => {
    let rootPages = [page({ id: "root-1" })];
    let subjects: UserSubject[] = [
      {
        id: "nb-1",
        name: "Notes",
        slug: "notes",
        icon: "📚",
        order: 0,
        pages: [page({ id: "nb-page" })],
        topicGroups: [
          {
            id: "tg-1",
            title: "Topic",
            slug: "topic",
            order: 0,
            pages: [page({ id: "topic-page" })],
          },
        ],
      },
    ];
    let pinned = subjects;

    applyExplorerContentChange(
      { type: "page-flags", pageId: "root-1", starred: true },
      {
        setSubjects: (u) => {
          subjects = typeof u === "function" ? u(subjects) : u;
        },
        setPinnedExtra: (u) => {
          pinned = typeof u === "function" ? u(pinned) : u;
        },
        setRootPages: (u) => {
          rootPages = typeof u === "function" ? u(rootPages) : u;
        },
        setExpandedNotebooks: vi.fn(),
        setExpandedTopics: vi.fn(),
        setTotalNotebooks: vi.fn(),
        reloadSilent: vi.fn(),
      }
    );
    expect(rootPages[0]?.starred).toBe(true);

    applyExplorerContentChange(
      { type: "page-flags", pageId: "topic-page", completed: true },
      {
        setSubjects: (u) => {
          subjects = typeof u === "function" ? u(subjects) : u;
        },
        setPinnedExtra: (u) => {
          pinned = typeof u === "function" ? u(pinned) : u;
        },
        setRootPages: (u) => {
          rootPages = typeof u === "function" ? u(rootPages) : u;
        },
        setExpandedNotebooks: vi.fn(),
        setExpandedTopics: vi.fn(),
        setTotalNotebooks: vi.fn(),
        reloadSilent: vi.fn(),
      }
    );
    expect(subjects[0]?.topicGroups?.[0]?.pages[0]?.completed).toBe(true);
    expect(pinned[0]?.topicGroups?.[0]?.pages[0]?.completed).toBe(true);
  });
});
