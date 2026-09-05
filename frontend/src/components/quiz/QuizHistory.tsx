"use client";

import Link from "next/link";
import { ThinkingIndicator } from "@/components/GreetingAccent";
import type { QuizSummary } from "@/lib/quiz/types";
import { DIFFICULTY_LABELS, quizHref } from "@/lib/quiz/href";

const STATUS: Record<string, string> = {
  GENERATING: "Generating",
  READY: "Ready",
  IN_PROGRESS: "In progress",
  SUBMITTED: "Submitted",
  GRADED: "Graded",
  FAILED: "Failed",
};

export function QuizHistory({
  quizzes,
  loading = false,
}: {
  quizzes: QuizSummary[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <ThinkingIndicator label="Loading past quizzes" />
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <p className="text-[13px] text-[var(--text-muted)]">
        No past quizzes yet. Generate one from New quiz.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--border)] rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)]">
      {quizzes.map((q) => (
        <li key={q.id}>
          <Link
            href={quizHref(q.id)}
            className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-[var(--bg-secondary)]"
          >
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium truncate text-[var(--text-primary)]">
                {q.title}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] truncate">
                {q.sourceLabel || q.sourceKind} · {DIFFICULTY_LABELS[q.difficulty]} ·{" "}
                {q.proctored !== false ? "Proctored" : "Practice"}
                {q.score ? ` · ${q.score.percent}%` : ""}
              </p>
            </div>
            <span className="text-[11px] font-medium text-[var(--text-secondary)] shrink-0">
              {q.score && (q.status === "GRADED" || q.status === "SUBMITTED")
                ? `${q.score.percent}%`
                : (STATUS[q.status] ?? q.status)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
