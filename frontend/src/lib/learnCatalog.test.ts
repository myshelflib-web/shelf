import { describe, expect, it } from "vitest";
import {
  catalogGoalLabel,
  featuredGoalFor,
  groupSubjectsByGoal,
  parseLearnPath,
  searchLearnCatalog,
  subjectGoal,
  subjectMatchesCatalogGoal,
  subjectsForCatalogGoal,
} from "./learnCatalog";
import { Subject } from "@/types";

function subject(
  slug: string,
  goal: Subject["studyGoal"],
  name = slug
): Subject {
  return {
    id: slug,
    name,
    slug,
    order: 0,
    studyGoal: goal,
    topics: [],
  };
}

describe("learnCatalog", () => {
  it("labels GENERAL as All tracks", () => {
    expect(catalogGoalLabel("GENERAL")).toBe("All tracks");
    expect(catalogGoalLabel("GATE")).toBe("GATE");
  });

  it("groups with the featured track first", () => {
    const groups = groupSubjectsByGoal(
      [
        subject("ncert", "UPSC"),
        subject("gate-info", "GATE"),
        subject("openstax", "CA"),
      ],
      "CA"
    );
    expect(groups.map((g) => g.goal)).toEqual(["CA", "UPSC", "GATE"]);
  });

  it("features the opened subject's goal over the catalog filter", () => {
    const opened = subject("openstax", "CA");
    expect(featuredGoalFor("GATE", opened)).toBe("CA");
    expect(featuredGoalFor("GATE", null)).toBe("GATE");
    expect(featuredGoalFor("GENERAL", null)).toBeUndefined();
  });

  it("parses learn browse and article paths", () => {
    expect(parseLearnPath("/learn")).toEqual({});
    expect(parseLearnPath("/learn/open-textbooks")).toEqual({
      subjectSlug: "open-textbooks",
    });
    expect(parseLearnPath("/learn/gate/syllabus")).toEqual({
      subjectSlug: "gate",
      topicSlug: "syllabus",
    });
    expect(parseLearnPath("/learn/gate/syllabus/ar-2026-syllabus")).toEqual({
      subjectSlug: "gate",
      topicSlug: "syllabus",
      articleSlug: "ar-2026-syllabus",
    });
  });

  it("defaults a missing studyGoal to GENERAL", () => {
    expect(subjectGoal(subject("misc", undefined))).toBe("GENERAL");
  });

  it("filters catalog subjects by study track", () => {
    const catalog = [
      subject("skills", "GENERAL"),
      subject("gate-info", "GATE"),
      subject("upsc-polity", "UPSC"),
    ];
    expect(subjectsForCatalogGoal(catalog, "GENERAL").map((s) => s.slug)).toEqual([
      "skills",
    ]);
    expect(subjectsForCatalogGoal(catalog, "GATE").map((s) => s.slug)).toEqual([
      "gate-info",
    ]);
    expect(subjectMatchesCatalogGoal(subject("gate-info", "GATE"), "GATE")).toBe(
      true
    );
    expect(subjectMatchesCatalogGoal(subject("gate-info", "GATE"), "UPSC")).toBe(
      false
    );
  });

  it("keeps Learning Science available on every study track", () => {
    const catalog = [
      subject("study-skills-learning", "GENERAL"),
      subject("gate-info", "GATE"),
      subject("upsc-polity", "UPSC"),
    ];
    expect(
      subjectsForCatalogGoal(catalog, "GATE").map((s) => s.slug)
    ).toEqual(["study-skills-learning", "gate-info"]);
    expect(
      subjectsForCatalogGoal(catalog, "UPSC").map((s) => s.slug)
    ).toEqual(["study-skills-learning", "upsc-polity"]);
    expect(
      subjectsForCatalogGoal(catalog, "GENERAL").map((s) => s.slug)
    ).toEqual(["study-skills-learning"]);
    expect(
      subjectMatchesCatalogGoal(
        subject("study-skills-learning", "GENERAL"),
        "NEET_PG"
      )
    ).toBe(true);
  });

  it("searches collections, topics, and articles", () => {
    const catalog: Subject[] = [
      {
        id: "gate",
        name: "Official GATE",
        slug: "official-gate",
        order: 0,
        studyGoal: "GATE",
        topics: [
          {
            id: "syl",
            title: "Syllabus",
            slug: "syllabus",
            order: 0,
            articles: [
              {
                id: "a1",
                title: "GATE 2026 syllabus",
                slug: "gate-2026-syllabus",
                order: 0,
                isPremium: false,
              },
            ],
          },
        ],
      },
    ];
    const hits = searchLearnCatalog(catalog, "syllabus");
    expect(hits.map((h) => h.title)).toEqual([
      "Syllabus",
      "GATE 2026 syllabus",
    ]);
    expect(hits[1]?.href).toBe(
      "/learn/official-gate/syllabus/gate-2026-syllabus"
    );
  });
});
