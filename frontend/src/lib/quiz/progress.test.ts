import { describe, expect, it } from "vitest";
import {
  quizProgressPercent,
  quizProgressStep,
} from "./progress";

describe("quizProgress", () => {
  it("advances generating steps over time without hitting 100%", () => {
    expect(quizProgressStep("generating", 0).label).toBe("Gathering material");
    expect(quizProgressStep("generating", 15_000).label).toBe(
      "Tuning difficulty"
    );
    expect(quizProgressPercent("generating", 0)).toBeGreaterThanOrEqual(8);
    expect(quizProgressPercent("generating", 60_000)).toBeLessThan(100);
  });

  it("covers create and submit phases", () => {
    expect(quizProgressStep("creating", 0).label).toMatch(/Starting/i);
    expect(quizProgressStep("submitting", 5_000).label).toMatch(/Grading/i);
    expect(quizProgressPercent("submitting", 1_000)).toBeGreaterThan(8);
  });
});
