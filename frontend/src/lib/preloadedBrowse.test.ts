import { describe, expect, it } from "vitest";
import { parseLearnPath } from "./learnCatalog";
import {
  browseHref,
  browsePathFromHref,
  preloadedExplorerMode,
  resolveBrowseArea,
} from "./preloadedBrowse";
import { Subject } from "@/types";

const polity: Subject = {
  id: "s1",
  name: "Polity",
  slug: "upsc-polity",
  order: 0,
  studyGoal: "UPSC",
  topics: [],
};

describe("parseLearnPath reserved segments", () => {
  it("does not treat tracks or current-affairs as subjects", () => {
    expect(parseLearnPath("/learn/tracks/gate")).toEqual({});
    expect(parseLearnPath("/learn/current-affairs")).toEqual({});
    expect(parseLearnPath("/learn/current-affairs/headline")).toEqual({});
  });

  it("still parses catalog browse and article paths", () => {
    expect(parseLearnPath("/learn/upsc-polity/constitution")).toEqual({
      subjectSlug: "upsc-polity",
      topicSlug: "constitution",
    });
  });
});

describe("preloadedExplorerMode", () => {
  it("keeps browse on the home tree so the left pane expands in place", () => {
    expect(
      preloadedExplorerMode({ workspaceMode: false, activeSubject: "upsc-polity" })
    ).toBe("home");
    expect(preloadedExplorerMode({ workspaceMode: false })).toBe("home");
  });

  it("scopes the reader sidebar to the open collection", () => {
    expect(
      preloadedExplorerMode({ workspaceMode: true, activeSubject: "upsc-polity" })
    ).toBe("collection");
    expect(preloadedExplorerMode({ workspaceMode: true })).toBe("tree");
  });
});

describe("browseHref / browsePathFromHref", () => {
  it("round-trips area, collection, and topic folders", () => {
    expect(browseHref({ areaId: "upsc" })).toBe("/learn?area=upsc");
    expect(browsePathFromHref("/learn?area=upsc")).toEqual({
      areaId: "upsc",
      subjectSlug: undefined,
      topicSlug: undefined,
    });
    expect(browseHref({ subjectSlug: "upsc-polity" })).toBe("/learn/upsc-polity");
    expect(
      browseHref({ subjectSlug: "upsc-polity", topicSlug: "constitution" })
    ).toBe("/learn/upsc-polity/constitution");
  });
});

describe("resolveBrowseArea", () => {
  it("prefers an explicit area, then infers from the subject track", () => {
    expect(resolveBrowseArea({ areaId: "books" }, [polity])).toBe("books");
    expect(resolveBrowseArea({ subjectSlug: "upsc-polity" }, [polity])).toBe(
      "upsc"
    );
    expect(resolveBrowseArea({}, [polity])).toBeNull();
  });
});
