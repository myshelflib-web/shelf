"use client";

import { useEffect, useState } from "react";
import { ThinkingIndicator } from "@/components/GreetingAccent";
import {
  quizProgressPercent,
  quizProgressStep,
  type QuizProgressPhase,
} from "@/lib/quiz/progress";

export function QuizProgressPanel({
  phase,
  startedAt,
  className = "",
}: {
  phase: QuizProgressPhase;
  /** ISO timestamp or epoch ms when this phase began. */
  startedAt?: string | number | null;
  className?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 400);
    return () => window.clearInterval(id);
  }, []);

  const startMs =
    typeof startedAt === "number"
      ? startedAt
      : startedAt
        ? new Date(startedAt).getTime()
        : now;
  const elapsed = Math.max(0, now - (Number.isFinite(startMs) ? startMs : now));
  const { label, detail } = quizProgressStep(phase, elapsed);
  const percent = quizProgressPercent(phase, elapsed);

  return (
    <div
      className={`flex flex-col items-center justify-center text-center gap-4 px-4 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <ThinkingIndicator label={label} />
      <div className="w-full max-w-sm space-y-2">
        <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <span>{detail}</span>
          <span className="tabular-nums shrink-0 ml-3">{percent}%</span>
        </div>
      </div>
    </div>
  );
}

/** Full-screen dim overlay used while submitting / creating. */
export function QuizProgressOverlay({
  phase,
  startedAt,
}: {
  phase: QuizProgressPhase;
  startedAt?: string | number | null;
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
      <div className="w-full max-w-md rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-8 shadow-2xl">
        <QuizProgressPanel phase={phase} startedAt={startedAt} />
      </div>
    </div>
  );
}
