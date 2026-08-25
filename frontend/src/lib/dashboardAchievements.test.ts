import { describe, expect, it } from "vitest";
import {
  DASHBOARD_ACHIEVEMENTS,
  dashboardAchievementState,
  isAchievementEarned,
} from "./dashboardAchievements";

describe("dashboardAchievements", () => {
  it("defines eight badges", () => {
    expect(DASHBOARD_ACHIEVEMENTS).toHaveLength(8);
  });

  it("unlocks first session and library independently of streak length", () => {
    expect(
      isAchievementEarned("first-read", {
        streak: 0,
        activeDays: 1,
        hasLibrary: false,
      })
    ).toBe(true);
    expect(
      isAchievementEarned("library", {
        streak: 0,
        activeDays: 0,
        hasLibrary: true,
      })
    ).toBe(true);
    expect(
      isAchievementEarned("week", {
        streak: 6,
        activeDays: 10,
        hasLibrary: true,
      })
    ).toBe(false);
  });

  it("counts earned badges", () => {
    const rows = dashboardAchievementState({
      streak: 7,
      activeDays: 8,
      hasLibrary: true,
    });
    expect(rows.filter((r) => r.earned).map((r) => r.id)).toEqual([
      "first-read",
      "three-day",
      "week",
      "library",
      "regular",
    ]);
  });
});
