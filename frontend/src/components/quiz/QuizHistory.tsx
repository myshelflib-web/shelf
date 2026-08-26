"use client";

import Link from "next/link";
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
}: {
  quizzes: QuizSummary[];
}) {
  if (quizzes.length === 0) {
    return (
      <p className="text-[13px] text-[var(--text-muted)]">
        No quizzes yet. Start one above.
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
                {q.mcqCount} MCQ · {q.writtenCount} written
              </p>
            </div>
            <span className="text-[11px] font-medium text-[var(--text-secondary)] shrink-0">
              {STATUS[q.status] ?? q.status}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
