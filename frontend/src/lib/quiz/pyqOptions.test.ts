import { describe, expect, it } from "vitest";
import {
  PYQ_ALL_SUBJECTS,
  coercePyqPaper,
  coercePyqYears,
  defaultPyqYears,
  pyqSubjectsForGoal,
  pyqYearsForGoal,
} from "./pyqOptions";

describe("pyqOptions", () => {
  it("puts All subjects first and uses UPSC subjects for UPSC", () => {
    const opts = pyqSubjectsForGoal("UPSC");
    expect(opts[0]).toEqual({
      value: PYQ_ALL_SUBJECTS,
      label: "All subjects",
    });
    expect(opts.map((o) => o.value)).toContain("Indian Polity & Constitution");
    expect(opts.map((o) => o.value)).not.toContain("Mechanical Engineering");
  });

  it("keeps GATE engineering papers for GATE", () => {
    const values = pyqSubjectsForGoal("GATE").map((o) => o.value);
    expect(values).toContain("Mechanical Engineering");
    expect(values).toContain("Computer Science & IT");
    expect(values[0]).toBe(PYQ_ALL_SUBJECTS);
  });

  it("resets invalid paper/years when the goal changes", () => {
    expect(coercePyqPaper("UPSC", "Mechanical Engineering")).toBe(
      PYQ_ALL_SUBJECTS
    );
    expect(coercePyqPaper("GATE", "Mechanical Engineering")).toBe(
      "Mechanical Engineering"
    );
    expect(coercePyqYears("CA", "2020–2025")).toBe(defaultPyqYears("CA"));
    expect(pyqYearsForGoal("UPSC").map((o) => o.value)).toContain("2015–2025");
  });
});
