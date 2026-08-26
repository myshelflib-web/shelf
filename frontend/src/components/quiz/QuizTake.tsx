"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { quizApi } from "@/lib/quiz/api";
import type { Quiz } from "@/lib/quiz/types";
import { quizBtnGhost, quizBtnPrimary } from "@/lib/quiz/ui";
import { QuizQuestionCard } from "./QuizQuestionCard";
import { QuizTimer } from "./QuizTimer";

export function QuizTake({
  quiz,
  onQuiz,
}: {
  quiz: Quiz;
  onQuiz: (next: Quiz) => void;
}) {
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const started = useRef(false);
  const saveTimer = useRef<number | null>(null);
  const q = quiz.questions[index];
  const reveal = quiz.status === "GRADED" || quiz.status === "SUBMITTED";

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (started.current || reveal || quiz.startedAt) return;
    started.current = true;
    void quizApi.save(quiz.id, { start: true }).then(({ quiz: next }) => onQuiz(next));
  }, [quiz.id, quiz.startedAt, reveal, onQuiz]);

  const saveAnswer = useCallback(
    async (patch: { optionId?: string | null; text?: string | null }) => {
      if (!q || reveal) return;
      try {
        const { quiz: next } = await quizApi.save(quiz.id, {
          start: true,
          answers: [{ questionId: q.id, ...patch }],
        });
        onQuiz(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save");
      }
    },
    [q, quiz.id, reveal, onQuiz]
  );

  const submit = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const { quiz: next } = await quizApi.submit(quiz.id);
      onQuiz(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setBusy(false);
    }
  }, [busy, quiz.id, onQuiz]);

  const onExpire = useCallback(() => {
    void submit();
  }, [submit]);

  if (!q) {
    return (
      <p className="text-[13px] text-[var(--text-muted)]">No questions yet.</p>
    );
  }

  return (
    <div className="flex flex-col gap-3 min-h-0">
      <div className="flex items-center gap-2 shrink-0">
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold truncate">{quiz.title}</div>
          <p className="text-[11px] text-[var(--text-muted)] truncate">
            {quiz.sourceLabel} · {quiz.difficulty.toLowerCase()}
          </p>
        </div>
        <QuizTimer remainingSec={quiz.remainingSec} onExpire={onExpire} />
        {!reveal && (
          <button
            type="button"
            className={quizBtnPrimary}
            disabled={busy}
            onClick={() => void submit()}
          >
            {busy ? "Submitting…" : "Submit"}
          </button>
        )}
        <Link href="/quiz" className={quizBtnGhost}>
          Exit
        </Link>
      </div>

      <div className="flex flex-wrap gap-1">
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

      {error && <p className="text-[12px] text-red-400">{error}</p>}

      <div className="flex-1 min-h-0 overflow-y-auto">
        <QuizQuestionCard
          question={q}
          index={index}
          total={quiz.questions.length}
          reveal={reveal}
          disabled={busy}
          onOption={(optionId) => void saveAnswer({ optionId })}
          onText={(text) => {
            onQuiz({
              ...quiz,
              questions: quiz.questions.map((item) =>
                item.id === q.id ? { ...item, userAnswerText: text } : item
              ),
            });
            if (saveTimer.current) window.clearTimeout(saveTimer.current);
            saveTimer.current = window.setTimeout(() => {
              void quizApi.save(quiz.id, {
                answers: [{ questionId: q.id, text }],
              });
            }, 700);
          }}
          onImage={async (file) => {
            setBusy(true);
            try {
              const { quiz: next } = await quizApi.uploadAnswerImage(
                quiz.id,
                q.id,
                file
              );
              onQuiz(next);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Upload failed");
            } finally {
              setBusy(false);
            }
          }}
        />
      </div>

      {!reveal && (
        <div className="flex justify-between shrink-0">
          <button
            type="button"
            className={quizBtnGhost}
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            Previous
          </button>
          <button
            type="button"
            className={quizBtnGhost}
            disabled={index >= quiz.questions.length - 1}
            onClick={() => {
              void saveAnswer({ text: q.userAnswerText });
              setIndex((i) => Math.min(quiz.questions.length - 1, i + 1));
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
