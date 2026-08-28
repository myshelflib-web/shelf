"use client";

import { QuizTake } from "./QuizTake";
import type { Quiz } from "@/lib/quiz/types";

export function QuizResults({
  quiz,
  onQuiz,
  notice,
}: {
  quiz: Quiz;
  onQuiz: (next: Quiz) => void;
  notice?: string | null;
}) {
  const score = quiz.score;
  return (
    <div className="flex flex-col gap-3 min-h-0 h-full">
      {notice && (
        <p className="text-[13px] text-amber-400/90 rounded-[10px] border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          {notice}
        </p>
      )}
      {score && (
        <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 flex items-baseline gap-3">
          <div className="text-[22px] font-semibold tabular-nums">
            {score.percent}%
          </div>
          <p className="text-[13px] text-[var(--text-secondary)]">
            {score.earned} / {score.max} marks
          </p>
        </div>
      )}
      <div className="flex-1 min-h-0">
        <QuizTake quiz={quiz} onQuiz={onQuiz} />
      </div>
    </div>
  );
}
