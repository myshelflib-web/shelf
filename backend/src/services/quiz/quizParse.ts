import type { DraftMcqOption, DraftQuestion, QuizQuestionType } from "./quizLimits.js";
import {
  closeTruncatedJson,
  repairQuizJson,
} from "./quizJsonRepair.js";

const OPTION_IDS = ["A", "B", "C", "D"] as const;

function asType(raw: unknown): QuizQuestionType | null {
  const v = String(raw ?? "").toUpperCase();
  if (v === "MCQ" || v === "WRITTEN" || v === "IMAGE") return v;
  return null;
}

function stripFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (fenced) return fenced[1].trim();
  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
}

export function extractJsonObject(text: string): unknown {
  const body = stripFences(text);
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  const slice =
    start >= 0 && end > start ? body.slice(start, end + 1) : body.slice(Math.max(0, start));
  if (!slice.trim()) {
    throw new Error("Quiz model did not return JSON.");
  }
  const attempts = [
    slice,
    repairQuizJson(slice),
    repairQuizJson(closeTruncatedJson(slice)),
  ];
  let last: unknown;
  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate) as unknown;
    } catch (err) {
      last = err;
    }
  }
  throw last instanceof Error ? last : new Error("Quiz model did not return JSON.");
}

function asOptions(raw: unknown): DraftMcqOption[] | null {
  if (!Array.isArray(raw) || raw.length < 2) return null;
  const options: DraftMcqOption[] = [];
  for (let i = 0; i < Math.min(4, raw.length); i++) {
    const row = raw[i] as { id?: unknown; text?: unknown };
    const id = String(row?.id ?? OPTION_IDS[i] ?? String.fromCharCode(65 + i))
      .trim()
      .toUpperCase()
      .slice(0, 2);
    const text = String(row?.text ?? "").trim();
    if (!text) return null;
    options.push({ id: OPTION_IDS[i] ?? id, text });
  }
  if (options.length !== 4) return null;
  return options;
}

function asQuestion(raw: unknown): DraftQuestion | null {
  if (!raw || typeof raw !== "object") return null;
  const q = raw as Record<string, unknown>;
  const type = asType(q.type);
  const prompt = String(q.prompt ?? "").trim();
  if (!type || prompt.length < 8) return null;
  const marksRaw = Number(q.marks);
  const marks = Number.isFinite(marksRaw)
    ? Math.max(1, Math.min(25, Math.round(marksRaw)))
    : 1;
  const syllabusHeading = String(q.syllabusHeading ?? "").trim() || null;
  const sourceTag = String(q.sourceTag ?? "Practice").trim() || "Practice";
  const explanation = String(q.explanation ?? "").trim() || null;
  const modelAnswer = String(q.modelAnswer ?? "").trim() || null;

  if (type === "MCQ") {
    const options = asOptions(q.options);
    if (!options) return null;
    let correct = String(q.correctOptionId ?? "").trim().toUpperCase();
    if (!options.some((o) => o.id === correct)) {
      correct = options[0].id;
    }
    return {
      type,
      prompt,
      options,
      correctOptionId: correct,
      modelAnswer,
      explanation,
      marks,
      syllabusHeading,
      sourceTag,
    };
  }

  return {
    type,
    prompt,
    modelAnswer: modelAnswer || explanation || "See marking points in explanation.",
    explanation,
    marks: Math.max(marks, 5),
    syllabusHeading,
    sourceTag,
  };
}

export function parseGeneratedQuiz(text: string): {
  title: string;
  questions: DraftQuestion[];
} {
  const data = extractJsonObject(text) as {
    title?: unknown;
    questions?: unknown;
  };
  const title = String(data.title ?? "Quiz").trim().slice(0, 120) || "Quiz";
  if (!Array.isArray(data.questions)) {
    throw new Error("Quiz JSON is missing questions.");
  }
  const questions = data.questions
    .map(asQuestion)
    .filter((q): q is DraftQuestion => Boolean(q));
  if (questions.length === 0) {
    throw new Error("Quiz JSON had no usable questions.");
  }
  return { title, questions };
}

export function parseGradeJson(text: string): { score: number; feedback: string } {
  let score = 0;
  let feedback = "Could not score this answer automatically.";
  try {
    const data = extractJsonObject(text) as {
      score?: unknown;
      feedback?: unknown;
    };
    const n = Number(data.score);
    if (Number.isFinite(n)) score = Math.max(0, Math.min(1, n));
    const fb = String(data.feedback ?? "").trim();
    if (fb) feedback = fb.slice(0, 2000);
  } catch {
    /* keep defaults */
  }
  return { score, feedback };
}
