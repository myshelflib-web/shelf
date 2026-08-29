"use client";

import type { ReactNode } from "react";
import type { Quiz } from "@/lib/quiz/types";
import { quizBtnGhost, quizBtnPrimary } from "@/lib/quiz/ui";
import { QuizTimer } from "./QuizTimer";

export function QuizTakeChrome({
  quiz,
  index,
  setIndex,
  error,
  busy,
  proctored,
  onExpire,
  onSubmit,
  onPrev,
  onNext,
  children,
}: {
  quiz: Quiz;
  index: number;
  setIndex: (i: number) => void;
  error: string;
  busy: boolean;
  proctored: boolean;
  onExpire: () => void;
  onSubmit: () => void;
  onPrev: () => void;
  onNext: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-0 h-full overflow-hidden">
      <div className="flex items-center gap-2 shrink-0 px-5 sm:px-8 pt-4">
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold truncate">{quiz.title}</div>
          <p className="text-[11px] text-[var(--text-muted)] truncate">
            {quiz.sourceLabel} · {quiz.difficulty.toLowerCase()}
            {proctored ? " · Proctored" : " · Practice"}
          </p>
        </div>
        <QuizTimer remainingSec={quiz.remainingSec} onExpire={onExpire} />
        <button
          type="button"
          className={quizBtnPrimary}
          disabled={busy}
          onClick={onSubmit}
        >
          {busy ? "Submitting…" : "Submit"}
        </button>
      </div>

      <div className="flex flex-wrap gap-1 px-5 sm:px-8 mt-3 shrink-0">
        {quiz.questions.map((item, i) => {
          const filled =
            Boolean(item.userAnswerOption) ||
            Boolean(item.userAnswerText?.trim()) ||
            Boolean(item.userImageUrl);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-7 min-w-7 px-1.5 rounded-md text-[11px] font-semibold border ${
                i === index
                  ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]"
                  : filled
                    ? "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                    : "border-[var(--border)] text-[var(--text-muted)]"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-[12px] text-red-400 px-5 sm:px-8 mt-2 shrink-0">
          {error}
        </p>
      )}

      <div className="flex-1 min-h-0 overflow-hidden px-5 sm:px-8">
        <div className="h-full flex items-center justify-center">
          <div className="w-full max-w-[40rem] max-h-full overflow-y-auto py-4">
            {children}
          </div>
        </div>
      </div>

      <div className="flex justify-between shrink-0 px-5 sm:px-8 pb-4 pt-1">
        <button
          type="button"
          className={quizBtnGhost}
          disabled={index === 0}
          onClick={onPrev}
        >
          Previous
        </button>
        <button
          type="button"
          className={quizBtnGhost}
          disabled={index >= quiz.questions.length - 1}
          onClick={onNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
