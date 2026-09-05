"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  FoldVertical,
  RefreshCw,
  Search,
} from "lucide-react";
import clsx from "clsx";
import { STUDY_GOAL_LABELS } from "@/lib/studyGoal";
import {
  matchesSearch,
  parseLearnPath,
  subjectHref,
  subjectsForCatalogGoal,
  topicHref,
} from "@/lib/learnCatalog";
import { preloadedExplorerMode, resolveBrowseArea } from "@/lib/preloadedBrowse";
import { GuestStudyGoalSelect } from "@/components/learn/GuestStudyGoalSelect";
import { StudyGoal } from "@/types";
import { ExplorerSidebarSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { LibraryModeTabs } from "@/components/my-content/LibraryModeTabs";
import { PreloadedSubjectBranch } from "@/components/my-content/PreloadedSubjectBranch";
import { PersonalPageReaderScope } from "@/components/my-content/reader/types";
import { LibraryMode } from "@/lib/libraryMode";
import type { ExploreAreaId } from "@/lib/exploreCatalog";
import { getExploreArea, learnAreaHref } from "@/lib/exploreCatalog";
import { useLearnSubjects } from "@/hooks/useLearnSubjects";
import { ExploreSidebarBrowse } from "@/components/learn/explore/ExploreSidebarBrowse";
import { useOptionalPreloadedBrowse } from "@/components/learn/PreloadedBrowseContext";
import { useOptionalPreloadedOpenFiles } from "@/components/learn/PreloadedOpenFilesContext";
import { isCurriculumScope } from "@/lib/learnContent";

interface PreloadedLibrarySidebarProps {
  mode: LibraryMode;
  onModeChange: (mode: LibraryMode) => void;
  showPreloaded: boolean;
  studyGoal: StudyGoal;
  currentHref?: string;
  workspaceMode?: boolean;
  showGoalPicker?: boolean;
  onStudyGoalChange?: (goal: StudyGoal) => void;
  onOpenPage?: (payload: {
    href: string;
    title: string;
    pageId: string;
    scope: PersonalPageReaderScope;
  }) => void;
  onGuestLibraryClick?: () => void;
  exploreArea?: ExploreAreaId | null;
  className?: string;
}

export function PreloadedLibrarySidebar({
  mode,
  onModeChange,
  showPreloaded,
  studyGoal,
  currentHref,
  workspaceMode = false,
  showGoalPicker = false,
  onStudyGoalChange,
  onOpenPage,
  onGuestLibraryClick,
  exploreArea: exploreAreaProp,
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

  const folderBrowse = useOptionalPreloadedBrowse();
  const openFiles = useOptionalPreloadedOpenFiles();
  const fromHref = parseLearnPath(currentHref);
  const activeSubject =
    folderBrowse?.path.subjectSlug ?? fromHref.subjectSlug;
  const activeTopic = folderBrowse?.path.topicSlug ?? fromHref.topicSlug;
  const tabScope =
    openFiles?.activeTab && isCurriculumScope(openFiles.activeTab.scope)
      ? openFiles.activeTab.scope
      : null;
  const activeArticle =
    tabScope &&
    tabScope.subjectSlug === activeSubject &&
    tabScope.topicSlug === activeTopic
      ? tabScope.articleSlug
      : folderBrowse?.path.articleSlug ?? fromHref.articleSlug;
  const explorer = preloadedExplorerMode({ workspaceMode, activeSubject });
  const isReaderCollection = explorer === "collection";
  const isScopedCollection = isReaderCollection;
  const activeArea =
    folderBrowse?.path.areaId ??
    exploreAreaProp ??
    resolveBrowseArea(
      { subjectSlug: activeSubject, topicSlug: activeTopic },
      subjects
    );

  const activeSubjectData = activeSubject
    ? subjects.find((s) => s.slug === activeSubject)
    : undefined;

  useEffect(() => {
    if (!activeSubject || !activeSubjectData) return;
    setExpandedSubjects({ [activeSubject]: true });
    if (activeTopic) {
      setExpandedTopics({ [`${activeSubject}:${activeTopic}`]: true });
    } else {
      setExpandedTopics({});
    }
  }, [activeSubject, activeSubjectData, activeTopic]);

  useEffect(() => {
    if (isScopedCollection || workspaceMode) return;
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
  }, [activeSubject, activeTopic, isScopedCollection, workspaceMode]);

  const filtered = useMemo(() => {
    const goalScoped = subjectsForCatalogGoal(subjects, studyGoal);
    const byQuery = goalScoped.filter((s) => matchesSearch(s, query));
    if (isScopedCollection && activeSubjectData) {
      return matchesSearch(activeSubjectData, query)
        ? [activeSubjectData]
        : [];
    }
    const active = goalScoped.find((s) => s.slug === activeSubject);
    if (active && !byQuery.some((s) => s.id === active.id)) {
      return [active, ...byQuery];
    }
    return byQuery;
  }, [
    subjects,
    query,
    studyGoal,
    activeSubject,
    isScopedCollection,
    activeSubjectData,
  ]);

  const toggleSubject = (slug: string) => {
    setExpandedSubjects((prev) => ({ ...prev, [slug]: !prev[slug] }));
  };

  const toggleTopic = (subjectSlug: string, topicSlug: string) => {
    const key = `${subjectSlug}:${topicSlug}`;
    setExpandedTopics((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const collapseAll = () => {
    setExpandedSubjects({});
    setExpandedTopics({});
    folderBrowse?.setPath({});
  };

  const exploreSidebarMode = isReaderCollection ? "collection" : "home";

  const showFullTree = explorer === "tree";
  const showExploreBrowse = !showFullTree;

  const sidebarBackHref = isScopedCollection
    ? activeTopic && activeSubject
      ? subjectHref(activeSubject)
      : activeArea
        ? learnAreaHref(activeArea)
        : "/learn"
    : null;
  const sidebarBackLabel = isScopedCollection
    ? activeTopic && activeSubjectData
      ? activeSubjectData.name
      : activeArea
        ? getExploreArea(activeArea).title
        : "Explore"
    : null;

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
          {isScopedCollection && activeSubjectData ? (
            <span className="explore-side-collection-mark shrink-0" aria-hidden>
              {activeSubjectData.icon ||
                activeSubjectData.name.charAt(0).toUpperCase()}
            </span>
          ) : null}
          <h2 className="font-semibold text-sm truncate flex-1 min-w-0">
            {isScopedCollection && activeSubjectData
              ? activeSubjectData.name
              : "Explorer"}
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
            {!isScopedCollection ? (
              <button
                type="button"
                title="Collapse all collections and topics"
                aria-label="Collapse all"
                onClick={collapseAll}
                className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
              >
                <FoldVertical className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>
        {showGoalPicker && onStudyGoalChange && !isScopedCollection ? (
          <GuestStudyGoalSelect
            value={studyGoal}
            onChange={onStudyGoalChange}
            compact
          />
        ) : studyGoal !== "GENERAL" && !isScopedCollection ? (
          <p className="text-xs leading-snug text-[var(--text-muted)] px-1">
            {STUDY_GOAL_LABELS[studyGoal]} curriculum
          </p>
        ) : null}
        <div className="relative px-0.5">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isScopedCollection ? "Search this collection…" : "Search preloaded…"
            }
            className="w-full h-8 pl-8 pr-3 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] text-xs leading-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-1.5 py-2 min-h-0">
        {isScopedCollection && sidebarBackHref && sidebarBackLabel ? (
          <Link href={sidebarBackHref} className="explore-back-library mb-2">
            ← {sidebarBackLabel}
          </Link>
        ) : null}

        {showExploreBrowse ? (
          <ExploreSidebarBrowse
            mode={exploreSidebarMode}
            activeArea={activeArea}
            activeSubject={activeSubject}
            activeTopic={activeTopic}
            activeArticle={activeArticle}
            searchQuery={query}
            studyGoal={studyGoal}
            workspaceMode={workspaceMode}
            onOpenPage={onOpenPage}
          />
        ) : null}

        {showFullTree && (
          <div>
            {loading && subjects.length === 0 ? (
              <ExplorerSidebarSkeleton />
            ) : filtered.length === 0 ? (
              <p className="px-3 py-6 text-sm text-center text-[var(--text-muted)]">
                No preloaded material yet.
              </p>
            ) : (
              <div className="space-y-0.5">
                {filtered.map((subject) => (
                  <PreloadedSubjectBranch
                    key={subject.id}
                    subject={subject}
                    open={expandedSubjects[subject.slug] ?? false}
                    expandedTopics={expandedTopics}
                    activeSubject={activeSubject}
                    activeTopic={activeTopic}
                    activeArticle={activeArticle}
                    workspaceMode={workspaceMode}
                    navigateOnSubjectClick={!workspaceMode}
                    navigateOnTopicClick={!workspaceMode}
                    subjectHref={subjectHref(subject.slug)}
                    onToggleSubject={toggleSubject}
                    onToggleTopic={toggleTopic}
                    onOpenPage={onOpenPage}
                    getTopicHref={(topicSlug) =>
                      topicHref(subject.slug, topicSlug)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </nav>
    </aside>
  );
}
