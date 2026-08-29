"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { LearnCatalogToolbar } from "@/components/learn/LearnCatalogToolbar";
import { useAuth } from "@/hooks/useAuth";
import { useLearnStudyGoal } from "@/hooks/useLearnStudyGoal";
import { api } from "@/lib/api";
import { LEARN_CATALOG_GOAL_LABELS } from "@/lib/studyGoal";
import { Subject, StudyGoal } from "@/types";
import { BookOpen, ChevronRight } from "lucide-react";

function catalogGoalLabel(goal: StudyGoal | undefined): string {
  if (!goal) return "Curriculum";
  return LEARN_CATALOG_GOAL_LABELS[goal] ?? goal;
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

function countArticles(subjects: Subject[]): number {
  return subjects.reduce(
    (total, subject) =>
      total +
      subject.topics.reduce((n, t) => n + (t.articles?.length ?? 0), 0),
    0
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
    setLoading(true);
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
    const key = s.studyGoal ?? "GENERAL";
    (acc[key] ??= []).push(s);
    return acc;
  }, {});

  const trackKeys = Object.keys(byGoal).sort((a, b) => {
    if (a === "GENERAL") return 1;
    if (b === "GENERAL") return -1;
    return catalogGoalLabel(a as StudyGoal).localeCompare(
      catalogGoalLabel(b as StudyGoal)
    );
  });

  const singleGoal = goal !== "GENERAL";
  const articleCount = countArticles(filtered);

  return (
    <div className="h-full flex flex-col overflow-hidden learn-page">
      <Header />
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="learn-page-inner">
          <header className="learn-hero">
            <p className="learn-kicker">Free curriculum</p>
            <h1>Study library</h1>
            <p className="learn-lead">
              Browse syllabus guides, NCERT packs, and past papers — no account
              needed.{" "}
              {user ? (
                <>
                  Your personal library, highlights, and Study AI live in{" "}
                  <Link href="/my-content">My content</Link>.
                </>
              ) : (
                <>
                  <Link href="/login">Sign in</Link> for your own uploads,
                  highlights, and Study AI.
                </>
              )}
            </p>
          </header>

          <LearnCatalogToolbar
            studyGoal={goal}
            onStudyGoalChange={setGuestGoal}
            showGoalPicker={showGoalPicker}
            search={search}
            onSearchChange={setSearch}
            variant="catalog"
          />

          {!loading && filtered.length > 0 && (
            <p className="learn-summary">
              {filtered.length} subject{filtered.length === 1 ? "" : "s"}
              {articleCount > 0
                ? ` · ${articleCount} article${articleCount === 1 ? "" : "s"}`
                : ""}
              {singleGoal ? ` · ${catalogGoalLabel(goal)}` : " · all tracks"}
            </p>
          )}

          {loading && subjects.length === 0 ? (
            <div className="learn-skeleton-grid" aria-hidden>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="learn-skeleton-card" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="learn-empty">
              {search.trim()
                ? "No matches for your search. Try another keyword or clear the filter."
                : singleGoal
                  ? `No published curriculum for ${catalogGoalLabel(goal)} yet. Choose “All tracks” to browse everything.`
                  : "No published curriculum yet. Check back soon."}
            </div>
          ) : (
            <div className="mt-2">
              {singleGoal ? (
                <TrackSection
                  title={catalogGoalLabel(goal)}
                  subjects={filtered}
                />
              ) : (
                trackKeys.map((track) => (
                  <TrackSection
                    key={track}
                    title={catalogGoalLabel(track as StudyGoal)}
                    subjects={byGoal[track] ?? []}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function TrackSection({
  title,
  subjects,
}: {
  title: string;
  subjects: Subject[];
}) {
  return (
    <section className="learn-track-section">
      <h2 className="learn-track-heading">{title}</h2>
      <ul className="learn-subject-grid">
        {subjects.map((subject) => (
          <SubjectCard key={subject.id} subject={subject} />
        ))}
      </ul>
    </section>
  );
}

function SubjectCard({ subject }: { subject: Subject }) {
  const topicCount = subject.topics.length;
  const articleCount = subject.topics.reduce(
    (n, t) => n + (t.articles?.length ?? 0),
    0
  );

  return (
    <li>
      <Link href={`/learn/${subject.slug}`} className="learn-subject-card">
        <span className="learn-subject-icon" aria-hidden>
          {subject.icon ?? "📚"}
        </span>
        <div className="learn-subject-body">
          <h3 className="learn-subject-title">{subject.name}</h3>
          {subject.description && (
            <p className="learn-subject-desc">{subject.description}</p>
          )}
          <p className="learn-subject-meta">
            <BookOpen className="w-3.5 h-3.5" aria-hidden />
            {topicCount} topic{topicCount === 1 ? "" : "s"} · {articleCount}{" "}
            article{articleCount === 1 ? "" : "s"}
          </p>
        </div>
        <ChevronRight className="learn-subject-chevron" aria-hidden />
      </Link>
    </li>
  );
}
