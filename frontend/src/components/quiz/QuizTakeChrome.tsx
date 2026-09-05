"use client";

import type { ReactNode } from "react";
import type { Quiz } from "@/lib/quiz/types";
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
  onExit,
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
  onExit: () => void;
  children: ReactNode;
}) {
  const progressPercent = ((index + 1) / quiz.questions.length) * 100;

  return (
    <div className="flex flex-col min-h-0 h-full overflow-hidden bg-[var(--bg-primary)]">
      {/* Header (attemptTop) */}
      <div className="flex items-center justify-between shrink-0 h-[58px] border-b border-[var(--border)] px-5 sm:px-8 bg-[var(--bg-elevated)]">
        <div className="flex items-center min-w-0 flex-1">
          <button
            type="button"
            onClick={onExit}
            className="h-[31px] px-3 border border-[var(--border)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-secondary)] rounded-[9px] text-[11px] font-bold text-[var(--text-secondary)] transition-colors inline-flex items-center shrink-0"
          >
            ← Exit quiz
          </button>
          <div className="ml-3.5 text-[13.5px] font-bold truncate text-[var(--text-primary)]">
            {quiz.title}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:inline text-[10.5px] font-semibold text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded">
            {proctored ? "Timed assessment" : "Practice"}
          </span>
          
          {quiz.remainingSec != null && (
            <div className={`h-[27px] px-2.5 rounded-full inline-flex items-center gap-1 text-[11px] font-black tracking-wide ${
              quiz.remainingSec <= 60
                ? "bg-red-500/10 text-red-500 animate-pulse"
                : "bg-amber-500/10 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400"
            }`}>
              <QuizTimer remainingSec={quiz.remainingSec} onExpire={onExpire} />
            </div>
          )}

          <button
            type="button"
            className="h-[32px] px-3.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[11.5px] font-bold rounded-[9px] transition-colors shadow-sm"
            disabled={busy}
            onClick={onSubmit}
          >
            {busy ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>

      {/* Progress & Palette Section */}
      <div className="w-full max-w-[820px] mx-auto px-5 sm:px-8 pt-5 shrink-0 space-y-3">
        {/* Progress Bar (progress/track) */}
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] font-bold">
          <span>Question {index + 1} of {quiz.questions.length}</span>
          <span>{Math.round(progressPercent)}% Complete</span>
        </div>
        <div className="h-1.5 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--border)]/10">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question Palette */}
        <div className="flex flex-wrap gap-1.5 pt-1.5">
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
                className={`h-7 min-w-7 px-1.5 rounded-[8px] text-[10.5px] font-bold border transition-all duration-100 ${
                  i === index
                    ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)] ring-1 ring-[var(--accent)]/30"
                    : filled
                      ? "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:border-[var(--text-secondary)]"
                      : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-secondary)]"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="text-[12px] font-medium text-red-400 px-5 sm:px-8 mt-2 shrink-0 max-w-[820px] mx-auto w-full">
          {error}
        </p>
      )}

      {/* Main Question Display */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-8 py-4">
        <div className="w-full max-w-[820px] mx-auto h-full">
          {children}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="shrink-0 border-t border-[var(--border)] py-3 px-5 sm:px-8 bg-[var(--bg-elevated)] flex justify-between items-center">
        <button
          type="button"
          className="h-[36px] border border-[var(--border)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-secondary)] text-[12px] font-bold text-[var(--text-secondary)] px-4 rounded-[10px] disabled:opacity-30 disabled:pointer-events-none transition-colors"
          disabled={index === 0}
          onClick={onPrev}
        >
          Previous
        </button>

        {index < quiz.questions.length - 1 ? (
          <button
            type="button"
            className="h-[36px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[12px] font-bold px-4 rounded-[10px] transition-colors shadow-sm"
            onClick={onNext}
          >
            Next question
          </button>
        ) : (
          <button
            type="button"
            className="h-[36px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[12px] font-bold px-5 rounded-[10px] transition-colors shadow-sm"
            disabled={busy}
            onClick={onSubmit}
          >
            {busy ? "Submitting…" : "Submit quiz"}
          </button>
        )}
      </div>
    </div>
  );
}
