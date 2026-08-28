"use client";

import { ShieldCheck } from "lucide-react";
import { quizBtnGhost, quizBtnPrimary } from "@/lib/quiz/ui";
import { QuizTimer } from "./QuizTimer";

export function QuizProctorGate({
  title,
  remainingSec,
  alreadyStarted,
  busy,
  error,
  onBegin,
  onExpire,
  onBack,
}: {
  title: string;
  remainingSec: number | null;
  alreadyStarted: boolean;
  busy?: boolean;
  error?: string;
  onBegin: () => void;
  onExpire: () => void;
  onBack: () => void;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-6 text-center">
      <div className="w-full max-w-md">
        <div className="inline-flex items-center justify-center h-11 w-11 rounded-[10px] bg-[var(--accent-subtle)] text-[var(--accent)] mb-4">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">
          Proctored sitting
        </h1>
        <p className="mt-1 text-[14px] font-medium text-[var(--text-secondary)] truncate">
          {title}
        </p>
        <p className="mt-3 text-[13px] text-[var(--text-muted)] leading-relaxed">
          The paper opens in fullscreen with the question in the center.
          Switching tabs or apps, or leaving fullscreen, ends the quiz and
          submits what you have.
        </p>
        {remainingSec != null && alreadyStarted && (
          <p className="mt-3 text-[13px] text-[var(--text-secondary)]">
            Time left: <QuizTimer remainingSec={remainingSec} onExpire={onExpire} />
          </p>
        )}
        {error && <p className="mt-3 text-[12px] text-red-400">{error}</p>}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            className={quizBtnPrimary}
            disabled={busy}
            onClick={onBegin}
          >
            {busy
              ? "Starting…"
              : alreadyStarted
                ? "Enter fullscreen & continue"
                : "Enter fullscreen & start"}
          </button>
          <button type="button" className={quizBtnGhost} onClick={onBack}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
