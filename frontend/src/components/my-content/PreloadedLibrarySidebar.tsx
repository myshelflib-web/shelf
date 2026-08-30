"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FoldVertical,
  FolderOpen,
  RefreshCw,
  Search,
} from "lucide-react";
import clsx from "clsx";
import { STUDY_GOAL_LABELS } from "@/lib/studyGoal";
import {
  catalogGoalLabel,
  featuredGoalFor,
  groupSubjectsByGoal,
  matchesSearch,
  parseLearnPath,
} from "@/lib/learnCatalog";
import { GuestStudyGoalSelect } from "@/components/learn/GuestStudyGoalSelect";
import { StudyGoal, SubjectProgress } from "@/types";
import { ExplorerSidebarSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { LibraryModeTabs } from "@/components/my-content/LibraryModeTabs";
import { PreloadedSubjectBranch } from "@/components/my-content/PreloadedSubjectBranch";
import { PersonalPageReaderScope } from "@/components/my-content/reader/types";
import { LibraryMode } from "@/lib/libraryMode";
import { useLearnSubjects } from "@/hooks/useLearnSubjects";

interface PreloadedLibrarySidebarProps {
  mode: LibraryMode;
  onModeChange: (mode: LibraryMode) => void;
  showPreloaded: boolean;
  studyGoal: StudyGoal;
  currentHref?: string;
  workspaceMode?: boolean;
  progressBySubject?: SubjectProgress[];
  showGoalPicker?: boolean;
  onStudyGoalChange?: (goal: StudyGoal) => void;
  onOpenPage?: (payload: {
    href: string;
    title: string;
    pageId: string;
    scope: PersonalPageReaderScope;
  }) => void;
  className?: string;
}

export function PreloadedLibrarySidebar({
  mode,
  onModeChange,
  showPreloaded,
  studyGoal,
  currentHref,
  workspaceMode = false,
  progressBySubject = [],
  showGoalPicker = false,
  onStudyGoalChange,
  onOpenPage,
  className,
}: PreloadedLibrarySidebarProps) {
  const { subjects, loading, reload } = useLearnSubjects();
  const [query, setQuery] = useState("");
  const [expandedSubjects, setExpandedSubjects] = useState<
    Record<string, boolean>
  >({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>(
    {}
  );

  const browse = parseLearnPath(currentHref);
  const activeSubject = browse.subjectSlug;
  const activeTopic = browse.topicSlug;
  const activeArticle = browse.articleSlug;

  const activeSubjectObj = subjects.find((s) => s.slug === activeSubject);
  const featuredGoal = featuredGoalFor(studyGoal, activeSubjectObj);

  const getProgress = (slug: string) =>
    progressBySubject.find((p) => p.slug === slug);

  useEffect(() => {
    if (!activeSubject) return;
    setExpandedSubjects((prev) =>
      prev[activeSubject] ? prev : { ...prev, [activeSubject]: true }
    );
    if (activeTopic) {
      const key = `${activeSubject}:${activeTopic}`;
      setExpandedTopics((prev) =>
        prev[key] ? prev : { ...prev, [key]: true }
      );
    }
  }, [activeSubject, activeTopic]);

  useEffect(() => {
    if (featuredGoal) {
      setExpandedGoals((prev) =>
        prev[featuredGoal] ? prev : { ...prev, [featuredGoal]: true }
      );
      return;
    }
    if (subjects.length === 0) return;
    setExpandedGoals((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const subject of subjects) {
        const goal = subject.studyGoal ?? "GENERAL";
        if (!next[goal]) {
          next[goal] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [featuredGoal, subjects]);

  const filtered = useMemo(
    () => subjects.filter((s) => matchesSearch(s, query)),
    [subjects, query]
  );

  const groups = useMemo(
    () => groupSubjectsByGoal(filtered, featuredGoal),
    [filtered, featuredGoal]
  );

  const searching = query.trim().length > 0;

  const toggleSubject = (slug: string) => {
    setExpandedSubjects((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const toggleTopic = (subjectSlug: string, topicSlug: string) => {
    const key = `${subjectSlug}:${topicSlug}`;
    setExpandedTopics((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleGoal = (goal: StudyGoal) => {
    setExpandedGoals((prev) => ({ ...prev, [goal]: !prev[goal] }));
  };

  const collapseAll = () => {
    setExpandedSubjects({});
    setExpandedTopics({});
    setExpandedGoals(featuredGoal ? { [featuredGoal]: true } : {});
  };

  return (
    <aside
      className={clsx(
        "w-72 border-r border-[var(--border)] bg-[var(--bg-sidebar)] flex flex-col h-full overflow-hidden",
        className
      )}
    >
      <div className="p-2 border-b border-[var(--border)] space-y-2">
        <LibraryModeTabs
          mode={mode}
          onChange={onModeChange}
          showPreloaded={showPreloaded}
        />
        <div className="flex items-center gap-1 min-w-0 px-1">
          <FolderOpen className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
          <h2 className="font-semibold text-sm truncate flex-1 min-w-0">
            Explorer
          </h2>
          <div className="flex items-center shrink-0">
            <button
              type="button"
              title="Refresh preloaded list"
              aria-label="Refresh"
              onClick={() => void reload(true)}
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
            >
              <RefreshCw
                className={clsx("w-4 h-4", loading && "animate-spin")}
              />
            </button>
            <button
              type="button"
              title="Collapse all subjects and topics"
              aria-label="Collapse all"
              onClick={collapseAll}
              className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
            >
              <FoldVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
        {showGoalPicker && onStudyGoalChange ? (
          <GuestStudyGoalSelect
            value={studyGoal}
            onChange={onStudyGoalChange}
            compact
          />
        ) : studyGoal !== "GENERAL" ? (
          <p className="text-[11px] text-[var(--text-muted)] px-1">
            {STUDY_GOAL_LABELS[studyGoal]} curriculum
          </p>
        ) : null}
        <div className="relative px-0.5">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search preloaded…"
            className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-1.5 py-2">
        {loading && subjects.length === 0 ? (
          <ExplorerSidebarSkeleton />
        ) : filtered.length === 0 ? (
          <p className="px-3 py-6 text-sm text-center text-[var(--text-muted)]">
            No preloaded material yet.
          </p>
        ) : (
          <div className="space-y-2">
            {groups.map((group) => {
              const goalOpen =
                searching || (expandedGoals[group.goal] ?? false);
              const isFeatured = featuredGoal === group.goal;
              return (
                <div key={group.goal}>
                  <button
                    type="button"
                    onClick={() => toggleGoal(group.goal)}
                    className="w-full flex items-center justify-between gap-1 px-2 py-1 rounded-md hover:bg-[var(--bg-elevated)]"
                  >
                    <span className="flex items-center gap-1 min-w-0">
                      {goalOpen ? (
                        <ChevronDown className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                      )}
                      <span
                        className={clsx(
                          "text-[10px] uppercase tracking-wide font-medium truncate",
                          isFeatured
                            ? "text-[var(--text-secondary)]"
                            : "text-[var(--text-muted)]"
                        )}
                      >
                        {catalogGoalLabel(group.goal)}
                      </span>
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] tabular-nums shrink-0">
                      {group.subjects.length}
                    </span>
                  </button>
                  {goalOpen &&
                    group.subjects.map((subject) => {
                      const prog = getProgress(subject.slug);
                      return (
                        <PreloadedSubjectBranch
                          key={subject.id}
                          subject={subject}
                          open={expandedSubjects[subject.slug] ?? false}
                          expandedTopics={expandedTopics}
                          activeSubject={activeSubject}
                          activeTopic={activeTopic}
                          activeArticle={activeArticle}
                          completed={prog?.completed}
                          total={prog?.total}
                          workspaceMode={workspaceMode}
                          onToggleSubject={toggleSubject}
                          onToggleTopic={toggleTopic}
                          onOpenPage={onOpenPage}
                        />
                      );
                    })}
                </div>
              );
            })}
          </div>
        )}
      </nav>
    </aside>
  );
}
