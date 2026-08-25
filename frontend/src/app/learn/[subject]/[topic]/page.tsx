"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useLearnStudyGoal } from "@/hooks/useLearnStudyGoal";
import { api } from "@/lib/api";
import { Subject, SubjectProgress, TopicDetail } from "@/types";
import { isPremiumUser } from "@/lib/premium";
import { ChevronRight, FileText, Lock } from "lucide-react";

export default function TopicPage() {
  const params = useParams<{ subject: string; topic: string }>();
  const { user } = useAuth();
  const { goal, setGuestGoal, showGoalPicker } = useLearnStudyGoal();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [progressBySubject, setProgressBySubject] = useState<SubjectProgress[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const isPremium = isPremiumUser(user);

  useEffect(() => {
    api.subjects
      .list(goal !== "GENERAL" ? { studyGoal: goal } : undefined)
      .then(({ subjects: list }) => setSubjects(list));
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

  useEffect(() => {
    if (!params.subject || !params.topic) return;
    setLoading(true);
    api.subjects
      .getTopic(params.subject, params.topic)
      .then(({ topic: t }) => setTopic(t))
      .catch(() => setTopic(null))
      .finally(() => setLoading(false));
  }, [params.subject, params.topic]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          subjects={subjects}
          currentSubject={params.subject}
          currentTopic={params.topic}
          progressBySubject={progressBySubject}
          showGoalPicker={showGoalPicker}
          studyGoal={goal}
          onStudyGoalChange={setGuestGoal}
        />
        <main className="flex-1 overflow-y-auto px-8 py-8">
          {loading ? (
            <p className="text-[var(--text-muted)]">Loading topic...</p>
          ) : !topic ? (
            <p className="text-[var(--text-muted)]">Topic not found</p>
          ) : (
            <div className="max-w-3xl">
              <nav className="text-sm text-[var(--text-muted)] mb-4 flex items-center gap-1.5">
                <Link
                  href={`/learn/${topic.subject.slug}`}
                  className="hover:text-[var(--accent)]"
                >
                  {topic.subject.name}
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[var(--text-secondary)]">{topic.title}</span>
              </nav>

              <h1 className="text-3xl font-bold mb-2">{topic.title}</h1>
              {topic.description && (
                <p className="text-[var(--text-secondary)] mb-6">
                  {topic.description}
                </p>
              )}
              <p className="text-sm text-[var(--text-muted)] mb-6">
                {topic.articles.length}{" "}
                {topic.articles.length === 1 ? "article" : "articles"}
              </p>

              {topic.articles.length === 0 ? (
                <p className="text-[var(--text-muted)]">
                  No articles yet. Upload a PDF from the admin panel.
                </p>
              ) : (
                <div className="space-y-2">
                  {topic.articles.map((article, index) => (
                    <Link
                      key={article.id}
                      href={`/learn/${params.subject}/${params.topic}/${article.slug}`}
                      className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)] transition group"
                    >
                      <span className="text-xs font-mono text-[var(--text-muted)] w-6">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-[var(--accent-light)] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-[var(--accent)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-medium group-hover:text-[var(--accent)] transition truncate">
                          {article.title}
                        </h2>
                      </div>
                      {article.isPremium && !isPremium && (
                        <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)]" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
