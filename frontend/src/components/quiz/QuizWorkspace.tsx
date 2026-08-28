"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { LivelyLine } from "@/components/LivelyLine";
import { ThinkingIndicator } from "@/components/GreetingAccent";
import { useAuth } from "@/hooks/useAuth";
import { quizApi } from "@/lib/quiz/api";
import type { Quiz, QuizLaunch, QuizSummary } from "@/lib/quiz/types";
import { quizBtnGhost, quizBtnPrimary } from "@/lib/quiz/ui";
import { QuizHistory } from "./QuizHistory";
import { QuizResults } from "./QuizResults";
import { QuizSetup } from "./QuizSetup";
import { QuizTake } from "./QuizTake";

export function QuizWorkspace({
  quizId,
  launch,
}: {
  quizId?: string;
  launch?: QuizLaunch;
}) {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [history, setHistory] = useState<QuizSummary[]>([]);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [proctorNotice, setProctorNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || quizId) return;
    void quizApi
      .list()
      .then(({ quizzes }) => setHistory(quizzes))
      .catch(() => {});
  }, [user, quizId]);

  const applyQuiz = useCallback(
    (next: Quiz) => {
      setQuiz(next);
      if (
        next.status === "READY" ||
        next.status === "FAILED" ||
        next.status === "GRADED"
      ) {
        void refreshUser();
      }
    },
    [refreshUser]
  );

  const load = useCallback(() => {
    if (!quizId) return;
    void quizApi
      .get(quizId)
      .then(({ quiz: next }) => {
        applyQuiz(next);
        setError("");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Quiz not found");
      });
  }, [quizId, applyQuiz]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!quizId || quiz?.status !== "GENERATING") return;
    const id = window.setInterval(load, 1600);
    return () => window.clearInterval(id);
  }, [quizId, quiz?.status, load]);

  if (authLoading || !user) {
    return (
      <div className="h-full flex items-center justify-center">
        <ThinkingIndicator label="Loading" />
      </div>
    );
  }

  const generating = quiz?.status === "GENERATING";
  const failed = quiz?.status === "FAILED";
  const graded = quiz?.status === "GRADED" || quiz?.status === "SUBMITTED";
  const taking = Boolean(quizId && quiz && !generating && !failed && !graded);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {!taking && <Header />}
      <main
        className={
          taking
            ? "flex-1 min-h-0"
            : "flex-1 min-h-0 px-5 sm:px-6 py-5 max-w-[52rem] mx-auto w-full flex flex-col"
        }
      >
        {!quizId ? (
          <>
            <div className="shrink-0 mb-4">
              <h1 className="page-title">Quiz</h1>
              <LivelyLine surface="quiz" className="page-subtitle mt-1" />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pb-8">
              <QuizSetup launch={launch} />
              <div>
                <h2 className="text-[13px] font-semibold text-[var(--text-secondary)] mb-2">
                  Recent
                </h2>
                <QuizHistory quizzes={history} />
              </div>
            </div>
          </>
        ) : generating ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <ThinkingIndicator label="Writing an exam-level paper" />
            <p className="text-[13px] text-[var(--text-muted)]">
              Grounding in your syllabus and notes…
            </p>
          </div>
        ) : failed ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-[14px] text-[var(--text-secondary)] max-w-md">
              {quiz?.errorMessage || "Could not generate this quiz."}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className={quizBtnPrimary}
                disabled={retrying}
                onClick={() => {
                  if (!quiz) return;
                  setRetrying(true);
                  void quizApi
                    .retry(quiz.id)
                    .then(({ quiz: next }) => applyQuiz(next))
                    .catch((err) =>
                      setError(err instanceof Error ? err.message : "Retry failed")
                    )
                    .finally(() => setRetrying(false));
                }}
              >
                Try again
              </button>
              <button type="button" className={quizBtnGhost} onClick={() => router.push("/quiz")}>
                Back
              </button>
            </div>
            {error && <p className="text-[12px] text-red-400">{error}</p>}
          </div>
        ) : quiz ? (
          graded ? (
            <QuizResults
              quiz={quiz}
              onQuiz={applyQuiz}
              notice={proctorNotice}
            />
          ) : (
            <QuizTake
              quiz={quiz}
              onQuiz={applyQuiz}
              onProctorEnd={(reason) =>
                setProctorNotice(
                  reason === "tab"
                    ? "This sitting ended because you switched away from the quiz."
                    : "This sitting ended because you left fullscreen."
                )
              }
            />
          )
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[13px] text-[var(--text-muted)]">
              {error || "Loading quiz…"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
