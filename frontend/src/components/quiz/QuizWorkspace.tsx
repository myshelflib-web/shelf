"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { ThinkingIndicator, GreetingDots } from "@/components/GreetingAccent";
import { useAuth } from "@/hooks/useAuth";
import { quizApi } from "@/lib/quiz/api";
import type { Quiz, QuizLaunch, QuizSummary } from "@/lib/quiz/types";
import { quizBtnGhost, quizBtnPrimary } from "@/lib/quiz/ui";
import { QuizHistory } from "./QuizHistory";
import { QuizHomeTabs } from "./QuizHomeTabs";
import { QuizResults } from "./QuizResults";
import { QuizSetup } from "./QuizSetup";
import { QuizTake } from "./QuizTake";
import { AnalyticsEvents, track } from "@/lib/analytics";

export function QuizWorkspace({
  quizId,
  launch,
  homeTab = "new",
}: {
  quizId?: string;
  launch?: QuizLaunch;
  homeTab?: "new" | "past";
}) {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [history, setHistory] = useState<QuizSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(!quizId);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [proctorNotice, setProctorNotice] = useState<string | null>(null);
  const failedTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || quizId) return;
    let cancelled = false;
    setHistoryLoading(true);
    void quizApi
      .list()
      .then(({ quizzes }) => {
        if (!cancelled) setHistory(quizzes);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
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

  useEffect(() => {
    if (quiz?.status !== "FAILED" || !quiz.id) return;
    if (failedTrackedRef.current === quiz.id) return;
    failedTrackedRef.current = quiz.id;
    track(AnalyticsEvents.quizGenerationFailed, {
      quizId: quiz.id,
      phase: "poll",
      error: quiz.errorMessage ?? "unknown",
      sourceKind: quiz.sourceKind,
    });
  }, [quiz]);

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
            ? "flex-1 min-h-0 overflow-hidden"
            : graded
              ? "flex-1 min-h-0 px-4 sm:px-6 py-4 sm:py-5 max-w-[64rem] mx-auto w-full overflow-y-auto"
              : "flex-1 min-h-0 px-4 sm:px-6 py-4 sm:py-5 max-w-[64rem] mx-auto w-full flex flex-col overflow-hidden"
        }
      >
        {!quizId ? (
          <>
            <div className="shrink-0 mb-5 flex flex-col">
              <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-[0.08em]">
                Quiz
              </span>
              <h1 className="text-[26px] sm:text-[30px] font-black tracking-tight text-[var(--text-primary)] mt-1.5 leading-tight">
                {homeTab === "past"
                  ? "Your Quiz History"
                  : "Test yourself on anything in your Shelf"}
                <GreetingDots className="text-[var(--text-muted)]" />
              </h1>
              <p className="text-[12px] text-[var(--text-muted)] leading-relaxed max-w-[700px] mt-1.5">
                {homeTab === "past"
                  ? "Review your past attempts, mistake logs, and performance metrics."
                  : "Choose your material, choose how you want to take the quiz, and generate. Shelf keeps the rest out of the way."}
              </p>
            </div>
            <div className="shrink-0 mb-5">
              <QuizHomeTabs tab={homeTab} launch={launch} />
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              {homeTab === "past" ? (
                <div className="h-full min-h-0 overflow-y-auto">
                  <QuizHistory quizzes={history} loading={historyLoading} />
                </div>
              ) : (
                <QuizSetup launch={launch} />
              )}
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
            <QuizResults quiz={quiz} notice={proctorNotice} />
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
