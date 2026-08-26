export const QUIZ_MCQ_MIN = 0;
export const QUIZ_MCQ_MAX = 20;
export const QUIZ_WRITTEN_MIN = 0;
export const QUIZ_WRITTEN_MAX = 8;
export const QUIZ_TOTAL_MAX = 25;
export const QUIZ_FOCUS_MAX = 200;
export const QUIZ_SOURCE_EXCERPT_MAX = 48_000;

export const QUIZ_TIME_PRESETS_SEC = [
  0, 300, 600, 900, 1200, 1800, 2700, 3600, 5400, 7200,
] as const;

export type QuizSourceKind = "LIBRARY" | "UPLOAD" | "EXAM_BANK";
export type QuizDifficulty = "EASY" | "MEDIUM" | "HARD" | "EXAM";
export type QuizQuestionType = "MCQ" | "WRITTEN" | "IMAGE";

const SOURCE_KINDS = new Set<QuizSourceKind>([
  "LIBRARY",
  "UPLOAD",
  "EXAM_BANK",
]);
const DIFFICULTIES = new Set<QuizDifficulty>([
  "EASY",
  "MEDIUM",
  "HARD",
  "EXAM",
]);

export function parseSourceKind(raw: unknown): QuizSourceKind {
  const v = String(raw ?? "LIBRARY").toUpperCase();
  if (SOURCE_KINDS.has(v as QuizSourceKind)) return v as QuizSourceKind;
  return "LIBRARY";
}

export function parseDifficulty(raw: unknown): QuizDifficulty {
  const v = String(raw ?? "EXAM").toUpperCase();
  if (DIFFICULTIES.has(v as QuizDifficulty)) return v as QuizDifficulty;
  return "EXAM";
}

export function clampMcqCount(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 5;
  return Math.max(QUIZ_MCQ_MIN, Math.min(QUIZ_MCQ_MAX, Math.round(n)));
}

export function clampWrittenCount(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 2;
  return Math.max(QUIZ_WRITTEN_MIN, Math.min(QUIZ_WRITTEN_MAX, Math.round(n)));
}

export function clampQuestionCounts(mcq: number, written: number): {
  mcqCount: number;
  writtenCount: number;
} {
  let mcqCount = clampMcqCount(mcq);
  let writtenCount = clampWrittenCount(written);
  if (mcqCount + writtenCount === 0) {
    mcqCount = 5;
  }
  if (mcqCount + writtenCount > QUIZ_TOTAL_MAX) {
    writtenCount = Math.max(0, QUIZ_TOTAL_MAX - mcqCount);
  }
  return { mcqCount, writtenCount };
}

export function parseTimeLimitSec(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  const sec = Math.round(n);
  const nearest = QUIZ_TIME_PRESETS_SEC.reduce((best, p) =>
    Math.abs(p - sec) < Math.abs(best - sec) ? p : best
  );
  return nearest === 0 ? null : nearest;
}

export function clampFocus(raw: unknown): string | null {
  const t = String(raw ?? "").trim().slice(0, QUIZ_FOCUS_MAX);
  return t || null;
}

export type DraftMcqOption = { id: string; text: string };

export type DraftQuestion = {
  type: QuizQuestionType;
  prompt: string;
  options?: DraftMcqOption[];
  correctOptionId?: string | null;
  modelAnswer?: string | null;
  explanation?: string | null;
  marks: number;
  syllabusHeading?: string | null;
  sourceTag?: string | null;
};
