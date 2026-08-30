import { describe, expect, it } from "vitest";
import {
  catalogGoalLabel,
  featuredGoalFor,
  groupSubjectsByGoal,
  parseLearnPath,
  subjectGoal,
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
});
