import { describe, expect, it } from "vitest";
import {
  buildStreakShareData,
  studyGoalShareLabel,
} from "@/lib/studyShare/buildStreakShareData";

describe("studyGoalShareLabel", () => {
  it("returns null for general", () => {
    expect(studyGoalShareLabel("GENERAL")).toBeNull();
    expect(studyGoalShareLabel(null)).toBeNull();
  });

  it("returns short labels for exam goals", () => {
    expect(studyGoalShareLabel("UPSC")).toBe("UPSC");
    expect(studyGoalShareLabel("NEET_PG")).toBe("NEET PG");
  });
});

describe("buildStreakShareData", () => {
  it("includes medal and goal when present", () => {
    const data = buildStreakShareData(
      {
        streak: 7,
        lastActiveDate: "2026-08-29",
        todaySeconds: 5400,
        activeDates: ["2026-08-29"],
      },
      "UPSC"
    );
    expect(data.streak).toBe(7);
    expect(data.todayLabel).toBe("1h 30m");
    expect(data.latestMedal?.label).toBe("Week warrior");
    expect(data.studyGoalLabel).toBe("UPSC");
    expect(data.weekActivity).toHaveLength(7);
  });
});
