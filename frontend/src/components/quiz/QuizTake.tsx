"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { quizApi } from "@/lib/quiz/api";
import type { Quiz } from "@/lib/quiz/types";
import { quizBtnGhost, quizBtnPrimary } from "@/lib/quiz/ui";
import { useQuizProctor, type QuizProctorReason } from "@/hooks/useQuizProctor";
import { QuizProctorGate } from "./QuizProctorGate";
import { QuizQuestionCard } from "./QuizQuestionCard";
import { QuizTimer } from "./QuizTimer";

export function QuizTake({
  quiz,
  onQuiz,
  onProctorEnd,
}: {
  quiz: Quiz;
  onQuiz: (next: Quiz) => void;
  onProctorEnd?: (reason: QuizProctorReason) => void;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const beginningRef = useRef(false);
  const q = quiz.questions[index];
  const reveal = quiz.status === "GRADED" || quiz.status === "SUBMITTED";

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

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

  const submittingRef = useRef(false);
  const submitRef = useRef<(opts?: { keepalive?: boolean }) => Promise<void>>(
    async () => {}
  );

  const { shellRef, enter, exit, release, armFilePicker } = useQuizProctor({
    active: locked && !reveal,
    onViolation: (reason) => {
      onProctorEnd?.(reason);
      void submitRef.current({ keepalive: true });
    },
  });

  const submit = useCallback(
    async (opts?: { keepalive?: boolean }) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setBusy(true);
      setError("");
      try {
        const { quiz: next } = await quizApi.submit(quiz.id, {
          keepalive: opts?.keepalive,
        });
        release();
        await exit();
        onQuiz(next);
      } catch (err) {
        submittingRef.current = false;
        setError(err instanceof Error ? err.message : "Could not submit");
      } finally {
        setBusy(false);
      }
    },
    [quiz.id, onQuiz, release, exit]
  );
  submitRef.current = submit;

  const onExpire = useCallback(() => {
    void submit();
  }, [submit]);

  const begin = useCallback(async () => {
    if (beginningRef.current || locked) return;
    beginningRef.current = true;
    setError("");
    try {
      await enter();
      setLocked(true);
      if (!quiz.startedAt) {
        const { quiz: next } = await quizApi.save(quiz.id, { start: true });
        onQuiz(next);
      }
    } catch (err) {
      beginningRef.current = false;
      setError(err instanceof Error ? err.message : "Could not start");
    }
  }, [enter, locked, quiz.id, quiz.startedAt, onQuiz]);

  if (!q) {
    return (
      <p className="text-[13px] text-[var(--text-muted)]">No questions yet.</p>
    );
  }

  const card = (
    <QuizQuestionCard
      question={q}
      index={index}
      total={quiz.questions.length}
      reveal={reveal}
      disabled={busy}
      onFilePickerOpen={reveal ? undefined : armFilePicker}
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
  );

  if (reveal) {
    return (
      <QuizTakeChrome
        quiz={quiz}
        index={index}
        setIndex={setIndex}
        error={error}
        busy={busy}
        reveal
        onExpire={onExpire}
        onSubmit={() => void submit()}
        onPrev={() => setIndex((i) => Math.max(0, i - 1))}
        onNext={() => {
          void saveAnswer({ text: q.userAnswerText });
          setIndex((i) => Math.min(quiz.questions.length - 1, i + 1));
        }}
      >
        {card}
      </QuizTakeChrome>
    );
  }

  return (
    <div
      ref={shellRef}
      data-shelf-hotkeys="off"
      className="fixed inset-0 z-[90] bg-[var(--bg-primary)] flex flex-col"
    >
      {!locked ? (
        <QuizProctorGate
          title={quiz.title}
          remainingSec={quiz.remainingSec}
          alreadyStarted={Boolean(quiz.startedAt)}
          busy={busy}
          error={error}
          onBegin={() => void begin()}
          onExpire={onExpire}
          onBack={() => router.push("/quiz")}
        />
      ) : (
        <QuizTakeChrome
          quiz={quiz}
          index={index}
          setIndex={setIndex}
          error={error}
          busy={busy}
          reveal={false}
          centered
          onExpire={onExpire}
          onSubmit={() => void submit()}
          onPrev={() => setIndex((i) => Math.max(0, i - 1))}
          onNext={() => {
            void saveAnswer({ text: q.userAnswerText });
            setIndex((i) => Math.min(quiz.questions.length - 1, i + 1));
          }}
        >
          {card}
        </QuizTakeChrome>
      )}
    </div>
  );
}

function QuizTakeChrome({
  quiz,
  index,
  setIndex,
  error,
  busy,
  reveal,
  centered,
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
  reveal: boolean;
  centered?: boolean;
  onExpire: () => void;
  onSubmit: () => void;
  onPrev: () => void;
  onNext: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 min-h-0 h-full">
      <div className={`flex items-center gap-2 shrink-0 ${centered ? "px-5 sm:px-8 pt-4" : ""}`}>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold truncate">{quiz.title}</div>
          <p className="text-[11px] text-[var(--text-muted)] truncate">
            {quiz.sourceLabel} · {quiz.difficulty.toLowerCase()}
            {!reveal && " · Proctored"}
          </p>
        </div>
        <QuizTimer remainingSec={quiz.remainingSec} onExpire={onExpire} />
        {!reveal && (
          <button
            type="button"
            className={quizBtnPrimary}
            disabled={busy}
            onClick={onSubmit}
          >
            {busy ? "Submitting…" : "Submit"}
          </button>
        )}
        {reveal && (
          <Link href="/quiz" className={quizBtnGhost}>
            Exit
          </Link>
        )}
      </div>

      <div className={`flex flex-wrap gap-1 ${centered ? "px-5 sm:px-8" : ""}`}>
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
        <p className={`text-[12px] text-red-400 ${centered ? "px-5 sm:px-8" : ""}`}>
          {error}
        </p>
      )}

      <div
        className={`flex-1 min-h-0 overflow-y-auto ${
          centered ? "px-5 sm:px-8" : ""
        }`}
      >
        {centered ? (
          <div className="min-h-full flex items-center justify-center py-6">
            <div className="w-full max-w-[40rem]">{children}</div>
          </div>
        ) : (
          children
        )}
      </div>

      {!reveal && (
        <div
          className={`flex justify-between shrink-0 ${
            centered ? "px-5 sm:px-8 pb-4" : ""
          }`}
        >
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
      )}
    </div>
  );
}
