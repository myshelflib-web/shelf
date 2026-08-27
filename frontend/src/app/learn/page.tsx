"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { LearnCatalogToolbar } from "@/components/learn/LearnCatalogToolbar";
import { useAuth } from "@/hooks/useAuth";
import { useLearnStudyGoal } from "@/hooks/useLearnStudyGoal";
import { api } from "@/lib/api";
import { STUDY_GOAL_LABELS } from "@/lib/studyGoal";
import { Subject, StudyGoal } from "@/types";
import { BookOpen, ChevronRight, Library } from "lucide-react";

function goalLabel(goal: StudyGoal | undefined): string {
  if (!goal) return "Curriculum";
  return STUDY_GOAL_LABELS[goal] ?? goal;
}

function matchesSearch(subject: Subject, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  if (subject.name.toLowerCase().includes(needle)) return true;
  return subject.topics.some(
    (t) =>
      t.title.toLowerCase().includes(needle) ||
      (t.articles ?? []).some((a) => a.title.toLowerCase().includes(needle))
  );
}

export default function LearnIndexPage() {
  const { user } = useAuth();
  const { goal, setGuestGoal, showGoalPicker } = useLearnStudyGoal();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    api.subjects
      .list(goal !== "GENERAL" ? { studyGoal: goal } : undefined)
      .then(({ subjects: list }) => {
        if (!cancelled) setSubjects(list);
      })
      .catch(() => {
        if (!cancelled) setSubjects([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [goal]);

  const filtered = useMemo(
    () => subjects.filter((s) => matchesSearch(s, search)),
    [subjects, search]
  );

  const byGoal = filtered.reduce<Record<string, Subject[]>>((acc, s) => {
    const key = s.studyGoal ?? "UPSC";
    (acc[key] ??= []).push(s);
    return acc;
  }, {});

  const singleGoal = goal !== "GENERAL";

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-8 max-w-3xl mx-auto w-full">
        <div className="flex items-start gap-3 mb-2">
          <Library className="w-7 h-7 text-[var(--accent)] shrink-0 mt-0.5" />
          <div>
            <h1 className="page-title">Study library</h1>
            <p className="page-subtitle mt-1">
              Free curriculum packs — read syllabus, NCERTs, and past papers
              without an account. Sign in for your personal library, highlights,
              and Study AI.
            </p>
          </div>
        </div>

        {!user && (
          <p className="mt-4 text-xs text-[var(--text-muted)] leading-relaxed">
            Pick your exam goal below, then browse material for that track.{" "}
            <Link
              href="/login"
              className="text-[var(--text-muted)] hover:text-[var(--accent)] underline-offset-2 hover:underline transition-colors"
            >
              Sign in
            </Link>{" "}
            for highlights and Study AI.
          </p>
        )}

        <LearnCatalogToolbar
          studyGoal={goal}
          onStudyGoalChange={setGuestGoal}
          showGoalPicker={showGoalPicker}
          search={search}
          onSearchChange={setSearch}
        />

        {loading && subjects.length === 0 ? (
          <p className="text-[var(--text-muted)] mt-8">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-[var(--text-muted)] mt-8">
            {search.trim()
              ? "No matches for your search."
              : singleGoal
                ? `No published curriculum for ${goalLabel(goal)} yet.`
                : "No published curriculum yet. Check back soon."}
          </p>
        ) : (
          <div className="mt-6 space-y-8">
            {singleGoal ? (
              <section>
                <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
                  {goalLabel(goal)}
                </h2>
                <ul className="space-y-2">
                  {filtered.map((subject) => (
                    <SubjectRow key={subject.id} subject={subject} />
                  ))}
                </ul>
              </section>
            ) : (
              Object.entries(byGoal).map(([track, list]) => (
                <section key={track}>
                  <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-3">
                    {goalLabel(track as StudyGoal)}
                  </h2>
                  <ul className="space-y-2">
                    {list.map((subject) => (
                      <SubjectRow key={subject.id} subject={subject} />
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function SubjectRow({ subject }: { subject: Subject }) {
  const topicCount = subject.topics.length;
  const articleCount = subject.topics.reduce(
    (n, t) => n + (t.articles?.length ?? 0),
    0
  );
  return (
    <li>
      <Link
        href={`/learn/${subject.slug}`}
        className="flex items-center gap-4 p-4 rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)]/50 transition group"
      >
        <span className="text-2xl shrink-0">{subject.icon ?? "📚"}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold group-hover:text-[var(--accent)] transition truncate">
            {subject.name}
          </h3>
          {subject.description && (
            <p className="text-sm text-[var(--text-muted)] truncate">
              {subject.description}
            </p>
          )}
          <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            {topicCount} topics · {articleCount} articles
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] shrink-0" />
      </Link>
    </li>
  );
}
