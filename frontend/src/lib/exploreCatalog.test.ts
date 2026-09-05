import { describe, expect, it } from "vitest";
import {
  areaGroupsSection,
  countAreaItems,
  featuredExploreCollections,
  featuredExploreCollectionsForGoal,
  formatArticleUpdatedAt,
  isExploreAreaId,
  listAreaResources,
  subjectsForArea,
  visibleExploreAreas,
  visibleExploreAreasForGoal,
} from "@/lib/exploreCatalog";
import { Subject } from "@/types";

const sampleSubjects = [
  {
    id: "s1",
    slug: "upsc-official",
    name: "UPSC Civil Services",
    studyGoal: "UPSC",
    order: 0,
    topics: [
      {
        id: "t1",
        slug: "syllabus",
        title: "Syllabus",
        order: 0,
        articles: [
          {
            id: "a1",
            slug: "cse-syllabus",
            title: "CSE Syllabus",
            order: 0,
            updatedAt: "2026-08-15T10:00:00.000Z",
          },
        ],
      },
    ],
  },
  {
    id: "s2",
    slug: "judiciary",
    name: "Bare Acts",
    studyGoal: "JUDICIARY",
    order: 1,
    topics: [
      {
        id: "t2",
        slug: "ipc",
        title: "IPC",
        order: 0,
        articles: [{ id: "a2", slug: "ipc", title: "IPC Bare Act", order: 0 }],
      },
    ],
  },
  {
    id: "s3",
    slug: "gate",
    name: "GATE",
    studyGoal: "GATE",
    order: 2,
    topics: [
      {
        id: "t3",
        slug: "mech",
        title: "Mechanical",
        order: 0,
        articles: [
          { id: "a3", slug: "gate-mech", title: "GATE Mechanical Syllabus", order: 0 },
        ],
      },
    ],
  },
  {
    id: "s4",
    slug: "study-skills-learning",
    name: "Learning science",
    studyGoal: "GENERAL",
    order: 3,
    topics: [
      {
        id: "t4",
        slug: "memory",
        title: "Memory",
        order: 0,
        articles: [
          { id: "a4", slug: "spaced-repetition", title: "Spaced repetition", order: 0 },
        ],
      },
    ],
  },
] as Subject[];

describe("exploreCatalog", () => {
  it("filters subjects by explore area goals", () => {
    expect(subjectsForArea(sampleSubjects, "law").map((s) => s.slug)).toEqual([
      "judiciary",
    ]);
    expect(subjectsForArea(sampleSubjects, "engineering").map((s) => s.slug)).toEqual([
      "gate",
    ]);
  });

  it("counts articles in an area without double-counting tracks", () => {
    expect(countAreaItems(sampleSubjects, "upsc")).toBe(1);
    expect(countAreaItems(sampleSubjects, "exams")).toBe(0);
    expect(countAreaItems(sampleSubjects, "law")).toBe(1);
    expect(countAreaItems(sampleSubjects, "engineering")).toBe(1);
    expect(countAreaItems(sampleSubjects, "policy")).toBe(0);
  });

  it("lists resources with optional query filter", () => {
    const all = listAreaResources(sampleSubjects, "upsc");
    expect(all).toHaveLength(1);
    expect(all[0]?.updatedAt).toBe("2026-08-15T10:00:00.000Z");
    const filtered = listAreaResources(sampleSubjects, "engineering", {
      query: "gate",
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toContain("GATE");
  });

  it("validates explore area ids", () => {
    expect(isExploreAreaId("law")).toBe(true);
    expect(isExploreAreaId("unknown")).toBe(false);
  });

  it("hides browse areas that have no published pages", () => {
    expect(visibleExploreAreas(sampleSubjects).map((a) => a.id)).toEqual([
      "upsc",
      "law",
      "engineering",
      "books",
    ]);
  });

  it("uses goal-specific group labels per browse area", () => {
    expect(areaGroupsSection("medicine").title).toBe("Curriculum groups");
    expect(areaGroupsSection("upsc").title).toBe("Paper collections");
  });

  it("formats article updated dates for cards", () => {
    expect(formatArticleUpdatedAt("2026-08-15T10:00:00.000Z")).toMatch(/2026/);
    expect(formatArticleUpdatedAt(null)).toBeNull();
  });

  it("picks featured collections with content", () => {
    const featured = featuredExploreCollections(sampleSubjects);
    expect(featured.length).toBeGreaterThan(0);
    expect(featured.length).toBeLessThanOrEqual(4);
  });

  it("limits General track users to non-exam browse areas", () => {
    expect(visibleExploreAreasForGoal(sampleSubjects, "GENERAL").map((a) => a.id)).toEqual([
      "books",
    ]);
    expect(
      visibleExploreAreasForGoal(sampleSubjects, "UPSC").map((a) => a.id)
    ).toEqual(["upsc"]);
    expect(
      visibleExploreAreasForGoal(sampleSubjects, "GATE").map((a) => a.id)
    ).toEqual(["engineering"]);
  });

  it("limits General track featured collections to study skills", () => {
    const featured = featuredExploreCollectionsForGoal(sampleSubjects, "GENERAL");
    expect(featured.every((s) => s.studyGoal === "GENERAL")).toBe(true);
    expect(featured.some((s) => s.slug === "study-skills-learning")).toBe(true);
  });

  it("includes Learning Science in featured collections for every track", () => {
    for (const goal of ["UPSC", "GATE", "JUDICIARY", "GENERAL"] as const) {
      const featured = featuredExploreCollectionsForGoal(sampleSubjects, goal);
      expect(featured.some((s) => s.slug === "study-skills-learning")).toBe(
        true
      );
    }
  });
});
