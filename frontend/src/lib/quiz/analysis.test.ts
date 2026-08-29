import { describe, expect, it } from "vitest";
import {
  analyzeQuiz,
  formatDuration,
  questionOutcome,
  scoreBand,
} from "./analysis";
import type { Quiz, QuizQuestion } from "./types";

function q(partial: Partial<QuizQuestion> & Pick<QuizQuestion, "id">): QuizQuestion {
  return {
    order: 0,
    type: "MCQ",
    prompt: "Q",
    options: null,
    marks: 1,
    syllabusHeading: null,
    sourceTag: null,
    userAnswerText: null,
    userAnswerOption: null,
    userImageUrl: null,
    gradedScore: null,
    ...partial,
  };
}

function quiz(questions: QuizQuestion[], extra: Partial<Quiz> = {}): Quiz {
  return {
    id: "q1",
    title: "Paper",
    sourceKind: "LIBRARY",
    contextKind: "LIBRARY",
    contextNotebookId: null,
    contextTopicId: null,
    contextPageId: null,
    relevancyDocId: null,
    sourceLabel: "Library",
    focusTopic: null,
    difficulty: "EXAM",
    timeLimitSec: 1800,
    mcqCount: questions.length,
    writtenCount: 0,
    proctored: true,
    endedReason: "TAB",
    status: "GRADED",
    startedAt: "2026-08-29T10:00:00.000Z",
    submittedAt: "2026-08-29T10:12:00.000Z",
    errorMessage: null,
    createdAt: "2026-08-29T09:00:00.000Z",
    updatedAt: "2026-08-29T10:12:00.000Z",
    remainingSec: null,
    questions,
    score: { earned: 2, max: 3, percent: 66.7 },
    ...extra,
  };
}

describe("quiz analysis", () => {
  it("classifies answers", () => {
    expect(
      questionOutcome(q({ id: "a", userAnswerOption: "A", gradedScore: 1 }))
    ).toBe("correct");
    expect(
      questionOutcome(q({ id: "b", userAnswerOption: "B", gradedScore: 0 }))
    ).toBe("incorrect");
    expect(
      questionOutcome(
        q({ id: "c", userAnswerText: "half", gradedScore: 0.5, type: "WRITTEN" })
      )
    ).toBe("partial");
    expect(questionOutcome(q({ id: "d" }))).toBe("skipped");
  });

  it("summarizes a sitting", () => {
    const a = analyzeQuiz(
      quiz([
        q({
          id: "1",
          order: 0,
          userAnswerOption: "A",
          gradedScore: 1,
          syllabusHeading: "Polity",
        }),
        q({
          id: "2",
          order: 1,
          userAnswerOption: "B",
          gradedScore: 0,
          syllabusHeading: "Polity",
        }),
        q({ id: "3", order: 2, syllabusHeading: "Economy" }),
      ])
    );
    expect(a.attempted).toBe(2);
    expect(a.skipped).toBe(1);
    expect(a.correct).toBe(1);
    expect(a.incorrect).toBe(1);
    expect(a.accuracy).toBe(50);
    expect(a.timeTakenSec).toBe(720);
    expect(a.endedLabel).toContain("switched");
    expect(a.topics).toHaveLength(2);
    expect(a.band).toBe("Good");
  });

  it("formats duration and bands", () => {
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(90)).toBe("1m 30s");
    expect(formatDuration(3600)).toBe("1h 0m");
    expect(scoreBand(92)).toBe("Outstanding");
    expect(scoreBand(20)).toBe("Keep going");
  });
});
