import { describe, expect, it } from "vitest";
import { Subject } from "@/types";
import {
  isOfficialSyllabusSubject,
  isOfficialSyllabusSubjectSlug,
  isSyllabusTopic,
  syllabusBrowseSubjects,
} from "./officialSyllabus";

describe("officialSyllabus", () => {
  it("recognizes canonical and legacy official syllabus slugs", () => {
    expect(isOfficialSyllabusSubjectSlug("official-syllabus-upsc")).toBe(true);
    expect(isOfficialSyllabusSubjectSlug("upsc-official-syllabus")).toBe(true);
    expect(isOfficialSyllabusSubjectSlug("syllabus-exam-pattern")).toBe(true);
    expect(isOfficialSyllabusSubjectSlug("upsc-polity")).toBe(false);
    expect(isOfficialSyllabusSubject({ slug: "official-syllabus-gate" })).toBe(
      true
    );
  });

  it("lists exam syllabus topics and skips General", () => {
    expect(isSyllabusTopic({ slug: "syllabus", title: "Syllabus" })).toBe(true);
    const catalog = [
      {
        id: "g",
        slug: "study-skills-learning",
        name: "Learning Science",
        studyGoal: "GENERAL",
        topics: [
          {
            id: "gt",
            slug: "syllabus",
            title: "Syllabus",
            articles: [{ id: "ga", slug: "how", title: "How to study" }],
          },
        ],
      },
      {
        id: "u",
        slug: "upsc-official",
        name: "UPSC Civil Services",
        studyGoal: "UPSC",
        topics: [
          {
            id: "ut",
            slug: "syllabus",
            title: "Syllabus",
            articles: [{ id: "ua", slug: "cse", title: "CSE Syllabus" }],
          },
          {
            id: "up",
            slug: "polity",
            title: "Polity",
            articles: [{ id: "up1", slug: "rights", title: "Rights" }],
          },
        ],
      },
    ] as Subject[];
    expect(syllabusBrowseSubjects(catalog).map((s) => s.slug)).toEqual([
      "upsc-official",
    ]);
    expect(
      syllabusBrowseSubjects(catalog)[0]?.topics.map((t) => t.slug)
    ).toEqual(["syllabus"]);
  });
});
