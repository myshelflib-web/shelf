import { describe, expect, it } from "vitest";
import {
  browseNotebooks,
  relevanceScore,
  type SlimNotebook,
} from "./notebookBrowse.js";

function nb(partial: Partial<SlimNotebook> & { id: string; name: string }): SlimNotebook {
  return {
    description: null,
    order: 0,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-02"),
    pageCount: 0,
    hasPdf: false,
    hasLink: false,
    hasStarred: false,
    pageTitles: [],
    ...partial,
  };
}

describe("relevanceScore", () => {
  it("ranks exact and prefix ahead of fuzzy", () => {
    const polity = nb({ id: "1", name: "Polity" });
    const notes = nb({ id: "2", name: "My Notebook" });
    expect(relevanceScore("polity", polity)).toBe(0);
    expect(relevanceScore("pol", polity)).toBe(1);
    expect(relevanceScore("polty", polity)).not.toBeNull();
    expect(relevanceScore("polty", notes)).toBeNull();
  });

  it("matches page titles", () => {
    const item = nb({
      id: "1",
      name: "GS",
      pageTitles: ["Fundamental Rights"],
      pageCount: 1,
    });
    expect(relevanceScore("fundamental", item)).toBe(4);
  });
});

describe("browseNotebooks", () => {
  const items = [
    nb({
      id: "a",
      name: "Polity",
      pageCount: 3,
      updatedAt: new Date("2026-03-01"),
    }),
    nb({
      id: "b",
      name: "My Notebook",
      pageCount: 0,
      updatedAt: new Date("2026-04-01"),
    }),
    nb({
      id: "c",
      name: "History",
      pageCount: 8,
      hasPdf: true,
      updatedAt: new Date("2026-02-01"),
    }),
  ];

  it("paginates eight at a time and filters empty", () => {
    const empty = browseNotebooks(items, { filter: "empty", page: 1 });
    expect(empty.ids).toEqual(["b"]);
    expect(empty.total).toBe(1);
  });

  it("returns closest name match first", () => {
    const { ids } = browseNotebooks(items, { q: "polty", sort: "name" });
    expect(ids[0]).toBe("a");
  });

  it("sorts by most pages", () => {
    const { ids } = browseNotebooks(items, { sort: "pages" });
    expect(ids).toEqual(["c", "a", "b"]);
  });

  it("sorts names descending", () => {
    const { ids } = browseNotebooks(items, { sort: "nameDesc" });
    expect(ids).toEqual(["a", "b", "c"]);
  });
});
