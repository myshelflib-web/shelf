"use client";

import Link from "next/link";
import { LearnCatalogToolbar } from "@/components/learn/LearnCatalogToolbar";
import { LearnCatalogSkeleton } from "@/components/learn/LearnBrowseSkeletons";
import { LearnSubjectCard } from "@/components/learn/LearnSubjectCard";
import {
  catalogGoalLabel,
  countArticles,
  GoalGroup,
} from "@/lib/learnCatalog";
import { StudyGoal } from "@/types";

export function LearnCatalogPane({
  groups,
  filterGoal,
  onFilterGoalChange,
  showGoalPicker,
  search,
  onSearchChange,
  loading,
  signedIn,
}: {
  groups: GoalGroup[];
  filterGoal: StudyGoal;
  onFilterGoalChange: (goal: StudyGoal) => void;
  showGoalPicker: boolean;
  search: string;
  onSearchChange: (q: string) => void;
  loading: boolean;
  signedIn: boolean;
}) {
  const subjectCount = groups.reduce((n, g) => n + g.subjects.length, 0);
  const articleCount = countArticles(groups.flatMap((g) => g.subjects));
  const singleGoal = filterGoal !== "GENERAL";

  return (
    <div className="learn-page h-full overflow-y-auto">
      <div className="learn-page-inner">
        <header className="learn-hero">
          <p className="learn-kicker">Free curriculum</p>
          <h1 className="page-title">Study library</h1>
          <p className="page-subtitle mt-2 max-w-xl">
            Syllabus guides, NCERT packs, and past papers — the same explorer
            you get after you sign in.{" "}
            {signedIn ? (
              <>
                Your uploads live in{" "}
                <Link href="/my-content" className="text-[var(--accent)]">
                  My content
                </Link>
                .
              </>
            ) : (
              <>
                <Link href="/login" className="text-[var(--accent)]">
                  Sign in
                </Link>{" "}
                to keep highlights and open Study AI.
              </>
            )}
          </p>
        </header>

        <LearnCatalogToolbar
          studyGoal={filterGoal}
          onStudyGoalChange={onFilterGoalChange}
          showGoalPicker={showGoalPicker}
          search={search}
          onSearchChange={onSearchChange}
          variant="catalog"
        />

        {!loading && subjectCount > 0 && (
          <p className="learn-summary">
            {subjectCount} collection{subjectCount === 1 ? "" : "s"}
            {articleCount > 0
              ? ` · ${articleCount} article${articleCount === 1 ? "" : "s"}`
              : ""}
            {singleGoal
              ? ` · ${catalogGoalLabel(filterGoal)} first`
              : " · all tracks"}
          </p>
        )}

        {loading && subjectCount === 0 ? (
          <div className="mt-6">
            <LearnCatalogSkeleton />
          </div>
        ) : subjectCount === 0 ? (
          <div className="learn-empty">
            {search.trim()
              ? "No matches for your search. Try another keyword or clear the filter."
              : "No published curriculum yet. Check back soon."}
          </div>
        ) : (
          <div className="mt-2">
            {groups.map((group) => (
              <section key={group.goal} className="learn-track-section">
                <h2 className="learn-track-heading">
                  {catalogGoalLabel(group.goal)}
                </h2>
                <ul className="learn-subject-grid">
                  {group.subjects.map((subject) => (
                    <li key={subject.id} className="h-full">
                      <LearnSubjectCard subject={subject} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
