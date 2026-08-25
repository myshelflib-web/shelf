"use client";

import Link from "next/link";
import { useState } from "react";
import { Subject, SubjectProgress, StudyGoal } from "@/types";
import {
  ChevronDown,
  ChevronRight,
  Circle,
  Search,
  Lock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isPremiumUser } from "@/lib/premium";
import { GuestStudyGoalSelect } from "@/components/learn/GuestStudyGoalSelect";
import { STUDY_GOAL_LABELS } from "@/lib/studyGoal";
import clsx from "clsx";

interface SidebarProps {
  subjects: Subject[];
  currentSubject?: string;
  currentTopic?: string;
  currentArticle?: string;
  progressBySubject?: SubjectProgress[];
  showGoalPicker?: boolean;
  studyGoal?: StudyGoal;
  onStudyGoalChange?: (goal: StudyGoal) => void;
  className?: string;
}

export function Sidebar({
  subjects,
  currentSubject,
  currentTopic,
  currentArticle,
  progressBySubject = [],
  showGoalPicker = false,
  studyGoal,
  onStudyGoalChange,
  className,
}: SidebarProps) {
  const { user } = useAuth();
  const isPremium = isPremiumUser(user);

  const [expandedSubjects, setExpandedSubjects] = useState<
    Record<string, boolean>
  >(() => {
    const init: Record<string, boolean> = {};
    if (currentSubject) init[currentSubject] = true;
    return init;
  });
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>(
    () => {
      const init: Record<string, boolean> = {};
      if (currentSubject && currentTopic) {
        init[`${currentSubject}/${currentTopic}`] = true;
      }
      return init;
    }
  );
  const [search, setSearch] = useState("");

  const toggleSubject = (slug: string) =>
    setExpandedSubjects((prev) => ({ ...prev, [slug]: !prev[slug] }));

  const toggleTopic = (key: string) =>
    setExpandedTopics((prev) => ({ ...prev, [key]: !prev[key] }));

  const getProgress = (slug: string) =>
    progressBySubject.find((p) => p.slug === slug);

  const filtered = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.topics.some(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          (t.articles ?? []).some((a) =>
            a.title.toLowerCase().includes(search.toLowerCase())
          )
      )
  );

  return (
    <aside
      className={clsx(
        "w-72 border-r border-[var(--border)] bg-[var(--bg-sidebar)] flex flex-col h-full overflow-hidden",
        className
      )}
    >
      <div className="p-4 border-b border-[var(--border)]">
        <Link
          href="/learn"
          className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] mb-2 block"
        >
          ← All subjects
        </Link>
        {currentSubject && (
          <h2 className="font-semibold text-sm truncate">
            {subjects.find((s) => s.slug === currentSubject)?.name ??
              "Subjects"}
          </h2>
        )}
      </div>

      <div className="p-3 space-y-2.5 border-b border-[var(--border)]">
        {showGoalPicker && studyGoal && onStudyGoalChange ? (
          <GuestStudyGoalSelect
            value={studyGoal}
            onChange={onStudyGoalChange}
            compact
          />
        ) : studyGoal && studyGoal !== "GENERAL" ? (
          <p className="text-[11px] text-[var(--text-muted)] px-0.5">
            Track: {STUDY_GOAL_LABELS[studyGoal]}
          </p>
        ) : null}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search topics & articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {filtered.map((subject) => {
          const prog = getProgress(subject.slug);
          const isSubjectExpanded = expandedSubjects[subject.slug] ?? false;

          return (
            <div key={subject.id} className="mb-1">
              <div className="flex items-center">
                <button
                  onClick={() => toggleSubject(subject.slug)}
                  className="p-2 rounded-lg hover:bg-[var(--bg-secondary)]"
                  aria-label="Toggle subject"
                >
                  {isSubjectExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  )}
                </button>
                <Link
                  href={`/learn/${subject.slug}`}
                  className={clsx(
                    "flex-1 flex items-center gap-2 px-2 py-2 rounded-lg text-sm hover:bg-[var(--bg-secondary)] transition text-left min-w-0",
                    currentSubject === subject.slug &&
                      !currentTopic &&
                      "bg-[var(--accent-light)] text-[var(--accent)]"
                  )}
                >
                  <span className="shrink-0">{subject.icon}</span>
                  <span className="flex-1 truncate font-medium">
                    {subject.name}
                  </span>
                  {prog && (
                    <span className="text-xs text-[var(--text-muted)] shrink-0">
                      {prog.completed}/{prog.total}
                    </span>
                  )}
                </Link>
              </div>

              {isSubjectExpanded && (
                <div className="ml-3 mt-0.5 space-y-0.5">
                  {subject.topics.map((topic) => {
                    const topicKey = `${subject.slug}/${topic.slug}`;
                    const isTopicExpanded = expandedTopics[topicKey] ?? false;
                    const isTopicActive =
                      currentSubject === subject.slug &&
                      currentTopic === topic.slug &&
                      !currentArticle;
                    const articles = topic.articles ?? [];

                    return (
                      <div key={topic.id}>
                        <div className="flex items-center">
                          {articles.length > 0 ? (
                            <button
                              onClick={() => toggleTopic(topicKey)}
                              className="p-1.5 rounded hover:bg-[var(--bg-secondary)]"
                              aria-label="Toggle topic"
                            >
                              {isTopicExpanded ? (
                                <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-[var(--text-muted)]" />
                              )}
                            </button>
                          ) : (
                            <span className="w-6" />
                          )}
                          <Link
                            href={`/learn/${subject.slug}/${topic.slug}`}
                            className={clsx(
                              "flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition min-w-0",
                              isTopicActive
                                ? "bg-[var(--accent-light)] text-[var(--accent)] font-medium"
                                : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                            )}
                          >
                            <span className="truncate flex-1">{topic.title}</span>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {articles.length}
                            </span>
                          </Link>
                        </div>

                        {isTopicExpanded && articles.length > 0 && (
                          <div className="ml-5 mt-0.5 space-y-0.5">
                            {articles.map((article) => {
                              const isActive =
                                currentSubject === subject.slug &&
                                currentTopic === topic.slug &&
                                currentArticle === article.slug;

                              return (
                                <Link
                                  key={article.id}
                                  href={`/learn/${subject.slug}/${topic.slug}/${article.slug}`}
                                  className={clsx(
                                    "flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition",
                                    isActive
                                      ? "bg-[var(--accent-light)] text-[var(--accent)] font-medium border-l-2 border-[var(--accent)]"
                                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                                  )}
                                >
                                  <Circle className="w-2.5 h-2.5 shrink-0 opacity-40" />
                                  <span className="truncate flex-1">
                                    {article.title}
                                  </span>
                                  {article.isPremium && !isPremium && (
                                    <Lock className="w-3 h-3 shrink-0 text-amber-500" />
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

export function ProgressCircle({ percent }: { percent: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative w-10 h-10">
      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="3"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium">
        {percent}%
      </span>
    </div>
  );
}
