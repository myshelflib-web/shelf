"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { QuizWorkspace } from "@/components/quiz/QuizWorkspace";
import { parseQuizSearch } from "@/lib/quiz/href";
import { ThinkingIndicator } from "@/components/GreetingAccent";

function QuizHomeInner() {
  const search = useSearchParams();
  const launch = parseQuizSearch(search);
  return <QuizWorkspace key={search.toString()} launch={launch} />;
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <ThinkingIndicator label="Loading" />
        </div>
      }
    >
      <QuizHomeInner />
    </Suspense>
  );
}
