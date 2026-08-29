import { describe, expect, it } from "vitest";
import { last7DayActivity, last7DayKeys } from "@/lib/studyShare/last7Days";

describe("last7DayKeys", () => {
  it("returns seven keys ending on today", () => {
    expect(last7DayKeys("2026-08-29")).toEqual([
      "2026-08-23",
      "2026-08-24",
      "2026-08-25",
      "2026-08-26",
      "2026-08-27",
      "2026-08-28",
      "2026-08-29",
    ]);
  });
});

describe("last7DayActivity", () => {
  it("marks active dates in the week window", () => {
    expect(
      last7DayActivity(
        ["2026-08-24", "2026-08-26", "2026-08-29"],
        "2026-08-29"
      )
    ).toEqual([false, true, false, true, false, false, true]);
  });
});
