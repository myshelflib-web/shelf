"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { quizApi } from "@/lib/quiz/api";
import type { Quiz } from "@/lib/quiz/types";
import { useQuizProctor, type QuizProctorReason } from "@/hooks/useQuizProctor";
import { QuizProctorGate } from "./QuizProctorGate";
import { QuizQuestionCard } from "./QuizQuestionCard";
import { QuizTakeChrome } from "./QuizTakeChrome";

function isProctored(quiz: Quiz): boolean {
  return quiz.proctored !== false;
}

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
  const proctored = isProctored(quiz);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(!proctored);
  const saveTimer = useRef<number | null>(null);
  const beginningRef = useRef(false);
  const q = quiz.questions[index];

  useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  const saveAnswer = useCallback(
    async (patch: { optionId?: string | null; text?: string | null }) => {
      if (!q) return;
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
    [q, quiz.id, onQuiz]
  );

  const submittingRef = useRef(false);
  const submitRef = useRef<
    (opts?: { keepalive?: boolean; endedReason?: string }) => Promise<void>
  >(async () => {});

  const { shellRef, enter, exit, release, armFilePicker } = useQuizProctor({
    active: proctored && locked,
    onViolation: (reason) => {
      onProctorEnd?.(reason);
      void submitRef.current({
        keepalive: true,
        endedReason: reason === "tab" ? "TAB" : "FULLSCREEN",
      });
    },
  });

  const submit = useCallback(
    async (opts?: { keepalive?: boolean; endedReason?: string }) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setBusy(true);
      setError("");
      try {
        const { quiz: next } = await quizApi.submit(quiz.id, {
          keepalive: opts?.keepalive,
          endedReason: opts?.endedReason ?? "SUBMIT",
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
    void submit({ endedReason: "TIMER" });
  }, [submit]);

  const begin = useCallback(async () => {
    if (beginningRef.current || locked) return;
    beginningRef.current = true;
    setError("");
    try {
      if (proctored) await enter();
      setLocked(true);
      if (!quiz.startedAt) {
        const { quiz: next } = await quizApi.save(quiz.id, { start: true });
        onQuiz(next);
      }
    } catch (err) {
      beginningRef.current = false;
      setError(err instanceof Error ? err.message : "Could not start");
    }
  }, [enter, locked, proctored, quiz.id, quiz.startedAt, onQuiz]);

  useEffect(() => {
    if (proctored || quiz.startedAt) return;
    void quizApi
      .save(quiz.id, { start: true })
      .then(({ quiz: next }) => onQuiz(next))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not start")
      );
  }, [proctored, quiz.id, quiz.startedAt, onQuiz]);

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
      reveal={false}
      disabled={busy}
      onFilePickerOpen={armFilePicker}
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

  const paper = (
    <QuizTakeChrome
      quiz={quiz}
      index={index}
      setIndex={setIndex}
      error={error}
      busy={busy}
      proctored={proctored}
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

  if (proctored) {
    return (
      <div
        ref={shellRef}
        data-shelf-hotkeys="off"
        className="fixed inset-0 z-[90] bg-[var(--bg-primary)] flex flex-col overflow-hidden"
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
          paper
        )}
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden bg-[var(--bg-primary)]">
      {paper}
    </div>
  );
}
