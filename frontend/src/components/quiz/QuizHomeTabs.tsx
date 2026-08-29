"use client";

import Link from "next/link";
import type { QuizLaunch } from "@/lib/quiz/types";
import { quizHomeHref } from "@/lib/quiz/href";

export function QuizHomeTabs({
  tab,
  launch,
}: {
  tab: "new" | "past";
  launch?: QuizLaunch;
}) {
  const item = (id: "new" | "past", label: string) => (
    <Link
      href={quizHomeHref(id, launch)}
      className={`px-3 py-1.5 rounded-md text-sm ${
        tab === id
          ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="inline-flex gap-0.5 p-0.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] shrink-0">
      {item("new", "New quiz")}
      {item("past", "Past quizzes")}
    </div>
  );
}
