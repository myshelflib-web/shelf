"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useLearnStudyGoal } from "@/hooks/useLearnStudyGoal";
import { api } from "@/lib/api";
import { Subject, SubjectProgress } from "@/types";
import { BookOpen, ChevronRight, FileText } from "lucide-react";

export default function SubjectPage() {
  const params = useParams<{ subject: string }>();
  const { user } = useAuth();
  const { goal, setGuestGoal, showGoalPicker } = useLearnStudyGoal();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [progressBySubject, setProgressBySubject] = useState<SubjectProgress[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.subjects
      .list(goal !== "GENERAL" ? { studyGoal: goal } : undefined)
      .then(({ subjects: list }) => {
      setSubjects(list);
      setLoading(false);
    });
  }, [goal]);

  useEffect(() => {
    if (!user) {
      setProgressBySubject([]);
      return;
    }
    api.progress
      .summary()
      .then(({ progressBySubject: progress }) => setProgressBySubject(progress))
      .catch(() => {});
  }, [user]);

  const subject = subjects.find((s) => s.slug === params.subject);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          subjects={subjects}
          currentSubject={params.subject}
          progressBySubject={progressBySubject}
          showGoalPicker={showGoalPicker}
          studyGoal={goal}
          onStudyGoalChange={setGuestGoal}
        />
        <main className="flex-1 overflow-y-auto px-8 py-8">
          {loading ? (
            <p className="text-[var(--text-muted)]">Loading subject...</p>
          ) : !subject ? (
            <p className="text-[var(--text-muted)]">Subject not found</p>
          ) : (
            <div className="max-w-3xl">
              <div className="mb-8">
                <p className="text-3xl mb-2">{subject.icon}</p>
                <h1 className="text-3xl font-bold mb-2">{subject.name}</h1>
                {subject.description && (
                  <p className="text-[var(--text-secondary)]">
                    {subject.description}
                  </p>
                )}
                <p className="text-sm text-[var(--text-muted)] mt-3 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  {subject.topics.length} topics
                </p>
              </div>

              {subject.topics.length === 0 ? (
                <p className="text-[var(--text-muted)]">
                  No topics yet. Upload a PDF from the admin panel.
                </p>
              ) : (
                <div className="space-y-3">
                  {subject.topics.map((topic) => {
                    const articleCount = topic.articles?.length ?? 0;
                    return (
                      <Link
                        key={topic.id}
                        href={`/learn/${subject.slug}/${topic.slug}`}
                        className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)] transition group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[var(--accent-light)] flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-[var(--accent)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="font-semibold group-hover:text-[var(--accent)] transition truncate">
                            {topic.title}
                          </h2>
                          <p className="text-sm text-[var(--text-muted)]">
                            {articleCount}{" "}
                            {articleCount === 1 ? "article" : "articles"}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)]" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
