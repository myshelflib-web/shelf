import { describe, expect, it } from "vitest";
import {
  clampQuestionCounts,
  parseDifficulty,
  parseSourceKind,
  parseTimeLimitSec,
} from "./quizLimits.js";
import { extractJsonObject, parseGeneratedQuiz, parseGradeJson } from "./quizParse.js";

describe("quizLimits", () => {
  it("clamps empty counts to a default MCQ paper", () => {
    expect(clampQuestionCounts(0, 0)).toEqual({ mcqCount: 5, writtenCount: 0 });
  });

  it("parses enums and time", () => {
    expect(parseSourceKind("exam_bank")).toBe("EXAM_BANK");
    expect(parseDifficulty("hard")).toBe("HARD");
    expect(parseTimeLimitSec(0)).toBeNull();
    expect(parseTimeLimitSec(900)).toBe(900);
  });
});

describe("quizParse", () => {
  it("extracts fenced JSON", () => {
    const data = extractJsonObject('```json\n{"title":"T","questions":[]}\n```') as {
      title: string;
    };
    expect(data.title).toBe("T");
  });

  it("parses mixed questions", () => {
    const { questions } = parseGeneratedQuiz(
      JSON.stringify({
        title: "Polity",
        questions: [
          {
            type: "MCQ",
            prompt: "Which article creates the Election Commission?",
            options: [
              { id: "A", text: "324" },
              { id: "B", text: "326" },
              { id: "C", text: "329" },
              { id: "D", text: "356" },
            ],
            correctOptionId: "A",
            explanation: "Art. 324.",
            marks: 1,
            syllabusHeading: "Polity — Elections",
            sourceTag: "Practice",
          },
          {
            type: "WRITTEN",
            prompt: "Discuss the independence of the ECI in 150 words.",
            modelAnswer: "Constitutional status; tenure; removal.",
            marks: 10,
            syllabusHeading: "Polity — Elections",
            sourceTag: "PYQ-style",
          },
        ],
      })
    );
    expect(questions).toHaveLength(2);
    expect(questions[0].type).toBe("MCQ");
    expect(questions[0].options).toHaveLength(4);
    expect(questions[1].type).toBe("WRITTEN");
  });

  it("parses grade JSON", () => {
    expect(parseGradeJson('{"score":0.6,"feedback":"Missed tenure."}')).toEqual({
      score: 0.6,
      feedback: "Missed tenure.",
    });
  });
});
