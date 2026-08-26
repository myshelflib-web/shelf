import type { Quiz, QuizQuestion } from "@prisma/client";
import { getPresignedUrl } from "../s3.js";

export type QuizQuestionClient = {
  id: string;
  order: number;
  type: QuizQuestion["type"];
  prompt: string;
  options: { id: string; text: string }[] | null;
  marks: number;
  syllabusHeading: string | null;
  sourceTag: string | null;
  userAnswerText: string | null;
  userAnswerOption: string | null;
  userImageUrl: string | null;
  correctOptionId?: string | null;
  modelAnswer?: string | null;
  explanation?: string | null;
  gradedScore?: number | null;
  gradedFeedback?: string | null;
};

export type QuizClient = {
  id: string;
  title: string;
  sourceKind: Quiz["sourceKind"];
  contextKind: string;
  contextNotebookId: string | null;
  contextTopicId: string | null;
  contextPageId: string | null;
  relevancyDocId: string | null;
  sourceLabel: string | null;
  focusTopic: string | null;
  difficulty: Quiz["difficulty"];
  timeLimitSec: number | null;
  mcqCount: number;
  writtenCount: number;
  status: Quiz["status"];
  startedAt: string | null;
  submittedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  remainingSec: number | null;
  questions: QuizQuestionClient[];
  score?: { earned: number; max: number; percent: number } | null;
};

function optionsOf(raw: unknown): { id: string; text: string }[] | null {
  if (!Array.isArray(raw)) return null;
  const out: { id: string; text: string }[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const id = String((row as { id?: unknown }).id ?? "").trim();
    const text = String((row as { text?: unknown }).text ?? "").trim();
    if (id && text) out.push({ id, text });
  }
  return out.length ? out : null;
}

export function remainingSeconds(quiz: {
  startedAt: Date | null;
  timeLimitSec: number | null;
  submittedAt: Date | null;
}): number | null {
  if (!quiz.timeLimitSec || !quiz.startedAt || quiz.submittedAt) return null;
  const end = quiz.startedAt.getTime() + quiz.timeLimitSec * 1000;
  return Math.max(0, Math.ceil((end - Date.now()) / 1000));
}

export function quizScore(questions: QuizQuestion[]): {
  earned: number;
  max: number;
  percent: number;
} | null {
  if (questions.length === 0) return null;
  if (questions.some((q) => q.gradedScore == null)) return null;
  let earned = 0;
  let max = 0;
  for (const q of questions) {
    max += q.marks;
    earned += (q.gradedScore ?? 0) * q.marks;
  }
  const percent = max > 0 ? Math.round((earned / max) * 1000) / 10 : 0;
  return { earned: Math.round(earned * 100) / 100, max, percent };
}

export async function toClientQuestion(
  q: QuizQuestion,
  reveal: boolean
): Promise<QuizQuestionClient> {
  let userImageUrl: string | null = null;
  if (q.userImageKey) {
    try {
      userImageUrl = await getPresignedUrl(q.userImageKey, 60 * 60);
    } catch {
      userImageUrl = null;
    }
  }
  const base: QuizQuestionClient = {
    id: q.id,
    order: q.order,
    type: q.type,
    prompt: q.prompt,
    options: optionsOf(q.options),
    marks: q.marks,
    syllabusHeading: q.syllabusHeading,
    sourceTag: q.sourceTag,
    userAnswerText: q.userAnswerText,
    userAnswerOption: q.userAnswerOption,
    userImageUrl,
  };
  if (!reveal) return base;
  return {
    ...base,
    correctOptionId: q.correctOptionId,
    modelAnswer: q.modelAnswer,
    explanation: q.explanation,
    gradedScore: q.gradedScore,
    gradedFeedback: q.gradedFeedback,
  };
}

export async function toClientQuiz(
  quiz: Quiz & { questions: QuizQuestion[] },
  reveal: boolean
): Promise<QuizClient> {
  const questions = await Promise.all(
    [...quiz.questions]
      .sort((a, b) => a.order - b.order)
      .map((q) => toClientQuestion(q, reveal))
  );
  const scored =
    reveal && (quiz.status === "GRADED" || quiz.status === "SUBMITTED")
      ? quizScore(quiz.questions)
      : null;
  return {
    id: quiz.id,
    title: quiz.title,
    sourceKind: quiz.sourceKind,
    contextKind: quiz.contextKind,
    contextNotebookId: quiz.contextNotebookId,
    contextTopicId: quiz.contextTopicId,
    contextPageId: quiz.contextPageId,
    relevancyDocId: quiz.relevancyDocId,
    sourceLabel: quiz.sourceLabel,
    focusTopic: quiz.focusTopic,
    difficulty: quiz.difficulty,
    timeLimitSec: quiz.timeLimitSec,
    mcqCount: quiz.mcqCount,
    writtenCount: quiz.writtenCount,
    status: quiz.status,
    startedAt: quiz.startedAt?.toISOString() ?? null,
    submittedAt: quiz.submittedAt?.toISOString() ?? null,
    errorMessage: quiz.errorMessage,
    createdAt: quiz.createdAt.toISOString(),
    updatedAt: quiz.updatedAt.toISOString(),
    remainingSec: remainingSeconds(quiz),
    questions,
    score: scored,
  };
}

export function shouldReveal(status: Quiz["status"]): boolean {
  return status === "SUBMITTED" || status === "GRADED";
}
