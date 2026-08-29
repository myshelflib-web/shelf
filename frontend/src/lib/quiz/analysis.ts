import type { Quiz, QuizEndedReason, QuizQuestion } from "./types";

export type QuestionOutcome = "correct" | "incorrect" | "partial" | "skipped";

export type TopicSlice = {
  heading: string;
  earned: number;
  max: number;
  percent: number;
  count: number;
};

export type TypeSlice = {
  type: string;
  label: string;
  earned: number;
  max: number;
  correct: number;
  total: number;
};

export type QuizAnalysis = {
  attempted: number;
  skipped: number;
  correct: number;
  incorrect: number;
  partial: number;
  accuracy: number | null;
  timeTakenSec: number | null;
  timeLimitSec: number | null;
  band: string;
  endedLabel: string;
  topics: TopicSlice[];
  types: TypeSlice[];
  outcomes: QuestionOutcome[];
};

const TYPE_LABEL: Record<string, string> = {
  MCQ: "MCQ",
  WRITTEN: "Written",
  IMAGE: "Image",
};

const ENDED_LABEL: Record<QuizEndedReason, string> = {
  SUBMIT: "You submitted",
  TAB: "Ended — switched away",
  FULLSCREEN: "Ended — left fullscreen",
  TIMER: "Time expired",
};

export function isAnswered(q: QuizQuestion): boolean {
  return Boolean(
    q.userAnswerOption ||
      q.userAnswerText?.trim() ||
      q.userImageUrl
  );
}

export function questionOutcome(q: QuizQuestion): QuestionOutcome {
  if (!isAnswered(q)) return "skipped";
  const score = q.gradedScore;
  if (score == null) return "skipped";
  if (score >= 0.99) return "correct";
  if (score <= 0) return "incorrect";
  return "partial";
}

export function scoreBand(percent: number): string {
  if (percent >= 90) return "Outstanding";
  if (percent >= 75) return "Excellent";
  if (percent >= 60) return "Good";
  if (percent >= 40) return "Needs practice";
  return "Keep going";
}

export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return r ? `${m}m ${r}s` : `${m}m`;
  return `${r}s`;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function analyzeQuiz(quiz: Quiz): QuizAnalysis {
  const outcomes = quiz.questions.map(questionOutcome);
  const attempted = outcomes.filter((o) => o !== "skipped").length;
  const skipped = outcomes.filter((o) => o === "skipped").length;
  const correct = outcomes.filter((o) => o === "correct").length;
  const incorrect = outcomes.filter((o) => o === "incorrect").length;
  const partial = outcomes.filter((o) => o === "partial").length;
  const accuracy =
    attempted > 0 ? round1((correct / attempted) * 100) : null;

  let timeTakenSec: number | null = null;
  if (quiz.startedAt && quiz.submittedAt) {
    timeTakenSec = Math.max(
      0,
      Math.round(
        (new Date(quiz.submittedAt).getTime() -
          new Date(quiz.startedAt).getTime()) /
          1000
      )
    );
    if (quiz.timeLimitSec) {
      timeTakenSec = Math.min(timeTakenSec, quiz.timeLimitSec);
    }
  }

  const percent = quiz.score?.percent ?? 0;
  const endedLabel =
    quiz.endedReason && ENDED_LABEL[quiz.endedReason]
      ? ENDED_LABEL[quiz.endedReason]
      : "You submitted";

  const topicMap = new Map<string, TopicSlice>();
  for (const q of quiz.questions) {
    const heading = q.syllabusHeading?.trim() || "Ungrouped";
    const row = topicMap.get(heading) ?? {
      heading,
      earned: 0,
      max: 0,
      percent: 0,
      count: 0,
    };
    row.count += 1;
    row.max += q.marks;
    row.earned += (q.gradedScore ?? 0) * q.marks;
    topicMap.set(heading, row);
  }
  const topics = [...topicMap.values()].map((t) => ({
    ...t,
    earned: round1(t.earned),
    percent: t.max > 0 ? round1((t.earned / t.max) * 100) : 0,
  }));

  const typeMap = new Map<string, TypeSlice>();
  for (const q of quiz.questions) {
    const row = typeMap.get(q.type) ?? {
      type: q.type,
      label: TYPE_LABEL[q.type] ?? q.type,
      earned: 0,
      max: 0,
      correct: 0,
      total: 0,
    };
    row.total += 1;
    row.max += q.marks;
    row.earned += (q.gradedScore ?? 0) * q.marks;
    if (questionOutcome(q) === "correct") row.correct += 1;
    typeMap.set(q.type, row);
  }
  const types = [...typeMap.values()].map((t) => ({
    ...t,
    earned: round1(t.earned),
  }));

  return {
    attempted,
    skipped,
    correct,
    incorrect,
    partial,
    accuracy,
    timeTakenSec,
    timeLimitSec: quiz.timeLimitSec,
    band: scoreBand(percent),
    endedLabel,
    topics,
    types,
    outcomes,
  };
}
