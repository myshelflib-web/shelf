"use client";

import type { Quiz } from "@/lib/quiz/types";
import { DIFFICULTY_LABELS } from "@/lib/quiz/href";
import {
  analyzeQuiz,
  formatDuration,
  type QuestionOutcome,
} from "@/lib/quiz/analysis";

const OUTCOME_CLASS: Record<QuestionOutcome, string> = {
  correct: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
  incorrect: "border-red-400/40 bg-red-500/10 text-red-300",
  partial: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  skipped: "border-[var(--border)] text-[var(--text-muted)]",
};

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 min-w-0">
      <div className="text-[10px] uppercase tracking-[0.03em] text-[var(--text-muted)]">
        {label}
      </div>
      <div className="mt-0.5 text-[15px] font-semibold tabular-nums text-[var(--text-primary)] truncate">
        {value}
      </div>
      {hint && (
        <p className="text-[11px] text-[var(--text-muted)] truncate">{hint}</p>
      )}
    </div>
  );
}

function ScoreRing({ percent }: { percent: number }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, percent)) / 100);
  return (
    <svg
      viewBox="0 0 88 88"
      className="w-[88px] h-[88px] shrink-0 text-[var(--text-primary)]"
    >
      <circle
        cx="44"
        cy="44"
        r={r}
        fill="none"
        stroke="var(--border)"
        strokeWidth="8"
      />
      <circle
        cx="44"
        cy="44"
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 44 44)"
      />
      <text
        x="44"
        y="49"
        textAnchor="middle"
        fill="currentColor"
        fontSize="16"
        fontWeight="600"
      >
        {percent}%
      </text>
    </svg>
  );
}

export function QuizAnalysisBoard({
  quiz,
  onJump,
}: {
  quiz: Quiz;
  onJump?: (index: number) => void;
}) {
  const a = analyzeQuiz(quiz);
  const score = quiz.score;
  const showTopics =
    a.topics.length > 1 ||
    (a.topics.length === 1 && a.topics[0]!.heading !== "Ungrouped");

  return (
    <div className="space-y-4">
      <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-4">
          <ScoreRing percent={score?.percent ?? 0} />
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] font-semibold text-[var(--text-primary)] truncate">
              {quiz.title}
            </h2>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              {score
                ? `${score.earned} / ${score.max} marks · ${a.band}`
                : a.band}
            </p>
            <p className="text-[12px] text-[var(--text-secondary)] mt-1">
              {quiz.proctored !== false ? "Proctored" : "Practice"} ·{" "}
              {DIFFICULTY_LABELS[quiz.difficulty] ?? quiz.difficulty} ·{" "}
              {a.endedLabel}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <StatCard
          label="Accuracy"
          value={a.accuracy == null ? "—" : `${a.accuracy}%`}
          hint={`${a.correct} of ${a.attempted} attempted`}
        />
        <StatCard
          label="Correct"
          value={String(a.correct)}
          hint={`${a.incorrect} incorrect${a.partial ? ` · ${a.partial} partial` : ""}`}
        />
        <StatCard
          label="Skipped"
          value={String(a.skipped)}
          hint={`${a.attempted} attempted`}
        />
        <StatCard
          label="Time taken"
          value={
            a.timeTakenSec == null ? "—" : formatDuration(a.timeTakenSec)
          }
          hint={
            a.timeLimitSec
              ? `of ${formatDuration(a.timeLimitSec)} allotted`
              : "No timer"
          }
        />
        <StatCard
          label="Questions"
          value={`${quiz.questions.length}`}
          hint={`${quiz.mcqCount} MCQ · ${quiz.writtenCount} written`}
        />
        <StatCard
          label="Source"
          value={quiz.sourceLabel || quiz.sourceKind}
          hint={quiz.focusTopic || undefined}
        />
      </div>

      {a.types.length > 0 && (
        <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
          <h3 className="text-[12px] font-semibold text-[var(--text-secondary)] mb-2">
            By question type
          </h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {a.types.map((t) => (
              <div key={t.type} className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[13px] font-medium">{t.label}</span>
                  <span className="text-[12px] tabular-nums text-[var(--text-secondary)]">
                    {t.correct}/{t.total} · {t.earned}/{t.max}
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{
                      width: `${t.max > 0 ? (t.earned / t.max) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showTopics && (
        <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
          <h3 className="text-[12px] font-semibold text-[var(--text-secondary)] mb-2">
            Topic performance
          </h3>
          <ul className="space-y-2">
            {a.topics.map((t) => (
              <li key={t.heading}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[13px] truncate">{t.heading}</span>
                  <span className="text-[12px] tabular-nums text-[var(--text-secondary)] shrink-0">
                    {t.percent}% · {t.earned}/{t.max}
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${t.percent}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="text-[12px] font-semibold text-[var(--text-secondary)] mb-2">
          Question palette
        </h3>
        <div className="flex flex-wrap gap-1">
          {a.outcomes.map((outcome, i) => (
            <button
              key={quiz.questions[i]!.id}
              type="button"
              onClick={() => onJump?.(i)}
              className={`h-7 min-w-7 px-1.5 rounded-md text-[11px] font-semibold border ${OUTCOME_CLASS[outcome]}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
