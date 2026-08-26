import { describe, expect, it } from "vitest";
import {
  closeTruncatedJson,
  repairQuizJson,
  userFacingQuizParseError,
} from "./quizJsonRepair.js";
import { parseGeneratedQuiz } from "./quizParse.js";

describe("quizJsonRepair", () => {
  it("fixes trailing commas (V8 double-quoted property error)", () => {
    const raw = `{
      "title": "Polity",
      "questions": [
        {
          "type": "MCQ",
          "prompt": "Which article?",
        },
      ],
    }`;
    expect(() => JSON.parse(raw)).toThrow(/double-quoted property name/i);
    const parsed = JSON.parse(repairQuizJson(raw)) as {
      title: string;
      questions: unknown[];
    };
    expect(parsed.title).toBe("Polity");
    expect(parsed.questions).toHaveLength(1);
  });

  it("quotes bare keys", () => {
    const raw = `{title: "T", questions: []}`;
    const parsed = JSON.parse(repairQuizJson(raw)) as { title: string };
    expect(parsed.title).toBe("T");
  });

  it("escapes LaTeX backslashes inside strings", () => {
    const raw = '{"prompt":"Find $\\frac{1}{2}$ of n"}';
    const parsed = JSON.parse(repairQuizJson(raw)) as { prompt: string };
    expect(parsed.prompt).toContain("\\frac");
  });

  it("closes truncated objects", () => {
    const raw = `{"title":"T","questions":[{"type":"MCQ","prompt":"Why federalism?"`;
    const parsed = JSON.parse(repairQuizJson(closeTruncatedJson(raw))) as {
      title: string;
    };
    expect(parsed.title).toBe("T");
  });

  it("hides raw JSON.parse messages", () => {
    expect(
      userFacingQuizParseError(
        new SyntaxError(
          "Expected double-quoted property name in JSON at position 11587"
        )
      )
    ).toMatch(/malformed/i);
  });
});

describe("extractJsonObject", () => {
  it("parses messy LLM quiz JSON", () => {
    const { questions, title } = parseGeneratedQuiz(`
\`\`\`json
{
  title: "Gate OS",
  "questions": [
    {
      "type": "MCQ",
      "prompt": "Waiting time of FCFS?",
      "options": [
        {"id":"A","text":"Can be high"},
        {"id":"B","text":"Always zero"},
        {"id":"C","text":"Undefined"},
        {"id":"D","text":"Negative"},
      ],
      "correctOptionId": "A",
      "explanation": "Convoy effect.",
      "marks": 1,
    },
  ],
}
\`\`\`
`);
    expect(title).toBe("Gate OS");
    expect(questions[0].type).toBe("MCQ");
  });
});
