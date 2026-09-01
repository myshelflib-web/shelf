import { describe, expect, it } from "vitest";
import {
  countAreaItems,
  featuredExploreCollections,
  isExploreAreaId,
  listAreaResources,
  subjectsForArea,
  visibleExploreAreas,
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
          { id: "a1", slug: "cse-syllabus", title: "CSE Syllabus", order: 0 },
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
    expect(countAreaItems(sampleSubjects, "exams")).toBe(1);
    expect(countAreaItems(sampleSubjects, "law")).toBe(1);
    expect(countAreaItems(sampleSubjects, "engineering")).toBe(1);
    expect(countAreaItems(sampleSubjects, "policy")).toBe(0);
  });

  it("lists resources with optional query filter", () => {
    const all = listAreaResources(sampleSubjects, "exams");
    expect(all).toHaveLength(1);
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
      "exams",
      "law",
      "engineering",
    ]);
  });

  it("picks featured collections with content", () => {
    const featured = featuredExploreCollections(sampleSubjects);
    expect(featured.length).toBeGreaterThan(0);
    expect(featured.length).toBeLessThanOrEqual(4);
  });
});
