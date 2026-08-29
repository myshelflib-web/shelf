"use client";

import { QuizQuestionCard } from "./QuizQuestionCard";
import { QuizAnalysisBoard } from "./QuizAnalysisBoard";
import type { Quiz } from "@/lib/quiz/types";
import { quizBtnGhost } from "@/lib/quiz/ui";
import Link from "next/link";

export function QuizResults({
  quiz,
  notice,
}: {
  quiz: Quiz;
  onQuiz?: (next: Quiz) => void;
  notice?: string | null;
}) {
  const jump = (index: number) => {
    document
      .getElementById(`quiz-review-${index}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Quiz analysis</h1>
          <p className="page-subtitle mt-1 truncate">{quiz.title}</p>
        </div>
        <Link href="/quiz?tab=past" className={quizBtnGhost}>
          Past quizzes
        </Link>
      </div>
      {notice && (
        <p className="text-[13px] text-amber-400/90 rounded-[10px] border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          {notice}
        </p>
      )}
      <QuizAnalysisBoard quiz={quiz} onJump={jump} />
      <section className="space-y-3">
        <h2 className="text-[13px] font-semibold text-[var(--text-secondary)]">
          Question review
        </h2>
        {quiz.questions.map((q, i) => (
          <div key={q.id} id={`quiz-review-${i}`}>
            <QuizQuestionCard
              question={q}
              index={i}
              total={quiz.questions.length}
              reveal
              disabled
              onOption={() => {}}
              onText={() => {}}
              onImage={() => {}}
            />
          </div>
        ))}
      </section>
    </div>
  );
}
