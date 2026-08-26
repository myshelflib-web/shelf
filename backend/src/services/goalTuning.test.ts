import { describe, expect, it } from "vitest";
import { StudyGoal } from "@prisma/client";
import { EXAM_GROUNDING, GOAL_TUNING } from "./goalTuning.js";

const GOALS: StudyGoal[] = [
  "GENERAL",
  "UPSC",
  "STATE_PCS",
  "JUDICIARY",
  "CA",
  "NEET_PG",
  "GATE",
];

describe("goalTuning", () => {
  it("covers every study goal with syllabus and PYQ discipline", () => {
    for (const goal of GOALS) {
      expect(GOAL_TUNING[goal].length).toBeGreaterThan(200);
      expect(GOAL_TUNING[goal]).toMatch(/Syllabus|Sources/i);
    }
    expect(EXAM_GROUNDING).toMatch(/PYQ/i);
    expect(EXAM_GROUNDING).toMatch(/Try next/i);
  });
});
