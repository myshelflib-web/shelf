import { describe, expect, it } from "vitest";
import {
  formatLastStudied,
  formatOpenedAgo,
  formatRelativeDayLabel,
  localDayDiff,
} from "./relativeDay";

const noon = (isoDate: string) => new Date(`${isoDate}T12:00:00`).getTime();

describe("relativeDay", () => {
  const now = noon("2026-08-22");

  it("counts local calendar days", () => {
    expect(localDayDiff(noon("2026-08-22"), now)).toBe(0);
    expect(localDayDiff(noon("2026-08-21"), now)).toBe(1);
    expect(localDayDiff(noon("2026-08-18"), now)).toBe(4);
  });

  it("labels today, yesterday, weekday, and older days", () => {
    expect(formatRelativeDayLabel(noon("2026-08-22"), now)).toBe("today");
    expect(formatRelativeDayLabel(noon("2026-08-21"), now)).toBe("yesterday");
    const weekday = formatRelativeDayLabel(noon("2026-08-17"), now);
    expect(weekday).not.toMatch(/today|yesterday|days ago/);
    expect(weekday.length).toBeGreaterThan(2);
    expect(formatRelativeDayLabel(noon("2026-08-10"), now)).toBe("12 days ago");
  });

  it("prefixes continue and notebook copy", () => {
    expect(formatLastStudied(noon("2026-08-21"), now)).toBe(
      "Last studied yesterday"
    );
    expect(formatOpenedAgo(noon("2026-08-22"), now)).toBe("Opened today");
    expect(formatOpenedAgo(noon("2026-08-21"), now)).toBe("Opened yesterday");
  });
});
