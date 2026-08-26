import { describe, expect, it } from "vitest";
import { formatClock, quizSetupHref, parseQuizSearch } from "./href";

describe("quiz href", () => {
  it("builds a scoped setup URL", () => {
    expect(
      quizSetupHref({
        source: "LIBRARY",
        contextKind: "PAGE",
        pageId: "p1",
        focus: "federalism",
      })
    ).toBe("/quiz?kind=PAGE&pageId=p1&focus=federalism");
  });

  it("parses search params", () => {
    const q = parseQuizSearch(
      new URLSearchParams("source=EXAM_BANK&focus=polity")
    );
    expect(q.source).toBe("EXAM_BANK");
    expect(q.focus).toBe("polity");
  });

  it("formats a countdown", () => {
    expect(formatClock(90)).toBe("1:30");
  });
});
