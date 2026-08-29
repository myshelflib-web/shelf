"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { parseQuizSearch } from "@/lib/quiz/href";
import { QuizWorkspace } from "./QuizWorkspace";

export function QuizPageClient({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={children}>
      <QuizHomeSwitch>{children}</QuizHomeSwitch>
    </Suspense>
  );
}

function QuizHomeSwitch({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const search = useSearchParams();
  if (user) {
    return (
      <QuizWorkspace
        key={search.toString()}
        launch={parseQuizSearch(search)}
        homeTab={search.get("tab") === "past" ? "past" : "new"}
      />
    );
  }
  return children;
}
