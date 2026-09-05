"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { MyContentSidebar } from "@/components/my-content/MyContentSidebar";
import { PreloadedLibrarySidebar } from "@/components/my-content/PreloadedLibrarySidebar";
import { LibraryModeTabs } from "@/components/my-content/LibraryModeTabs";
import { SignInPromptModal } from "@/components/learn/SignInPromptModal";
import { useLibraryMode } from "@/hooks/useLibraryMode";
import { useAuth } from "@/hooks/useAuth";
import { PersonalPageReaderScope } from "@/components/my-content/reader/types";
import { StudyGoal, UserSubject } from "@/types";
import { inferLibraryModeFromHref, LibraryMode } from "@/lib/libraryMode";
import type { ExploreAreaId } from "@/lib/exploreCatalog";
import { useOptionalPreloadedBrowse } from "@/components/learn/PreloadedBrowseContext";
import { useOptionalPreloadedOpenFiles } from "@/components/learn/PreloadedOpenFilesContext";
import { browseHref } from "@/lib/preloadedBrowse";

interface LibrarySidePanelProps {
  notebook?: UserSubject;
  notebookSlug?: string;
  currentTopicSlug?: string;
  currentPageSlug?: string;
  currentHref?: string;
  enablePageDrag?: boolean;
  workspaceMode?: boolean;
  showGoalPicker?: boolean;
  onStudyGoalChange?: (goal: StudyGoal) => void;
  onOpenPage?: (payload: {
    href: string;
    title: string;
    pageId: string;
    scope: PersonalPageReaderScope;
  }) => void;
  /** Parent owns the sign-in modal (e.g. LearnReaderWorkspace). */
  onGuestPersonalClick?: () => void;
  exploreArea?: ExploreAreaId | null;
  returnTo?: string;
  className?: string;
}

/**
 * Personal vs Preloaded explorer. Tabs appear for all study goals.
 * Guests stay on Preloaded; Personal opens a sign-in prompt.
 * When a reader tab is open, the active tab follows the document source.
 */
export function LibrarySidePanel(props: LibrarySidePanelProps) {
  const {
    onGuestPersonalClick,
    exploreArea,
    returnTo: returnToProp,
    showGoalPicker,
    onStudyGoalChange,
    currentHref,
    ...sidebarProps
  } = props;

  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { mode, setMode, showPreloaded, goal, isGuest } = useLibraryMode();
  const browse = useOptionalPreloadedBrowse();
  const openFiles = useOptionalPreloadedOpenFiles();
  const resolvedHref = browse?.interceptFolderNav
    ? openFiles?.activeTab?.href ?? browseHref(browse.path)
    : currentHref ?? (browse ? browseHref(browse.path) : undefined);
  const resolvedExploreArea = browse?.interceptFolderNav
    ? browse.path.areaId ?? null
    : exploreArea ?? browse?.path.areaId ?? null;
  const [signInFeature, setSignInFeature] = useState<string | null>(null);

  const handleModeChange = useCallback(
    (next: LibraryMode) => {
      if (next === "personal" && !user && !authLoading) {
        if (onGuestPersonalClick) {
          onGuestPersonalClick();
        } else {
          setSignInFeature("Your personal library");
        }
        return;
      }
      setMode(next);
    },
    [user, authLoading, onGuestPersonalClick, setMode]
  );

  useEffect(() => {
    const inferred = inferLibraryModeFromHref(resolvedHref);
    if (inferred) setMode(inferred);
  }, [resolvedHref, setMode]);

  const tabs: ReactNode = showPreloaded ? (
    <LibraryModeTabs
      mode={mode}
      onChange={handleModeChange}
      showPreloaded={showPreloaded}
    />
  ) : null;

  const preloadedActive = showPreloaded && mode === "preloaded";

  return (
    <>
      <div
        className={clsx("h-full", preloadedActive && "hidden")}
        aria-hidden={preloadedActive || undefined}
      >
        <MyContentSidebar
          {...sidebarProps}
          currentHref={resolvedHref}
          libraryModeTabs={tabs}
          className={sidebarProps.className}
        />
      </div>
      {showPreloaded ? (
        <div
          className={clsx("h-full", !preloadedActive && "hidden")}
          aria-hidden={!preloadedActive || undefined}
        >
          <PreloadedLibrarySidebar
            mode={mode}
            onModeChange={handleModeChange}
            showPreloaded={showPreloaded}
            studyGoal={goal}
            currentHref={resolvedHref}
            workspaceMode={sidebarProps.workspaceMode}
            showGoalPicker={Boolean(showGoalPicker) && isGuest}
            onStudyGoalChange={onStudyGoalChange}
            onOpenPage={sidebarProps.onOpenPage}
            onGuestLibraryClick={
              onGuestPersonalClick ?? (() => setSignInFeature("Your personal library"))
            }
            exploreArea={resolvedExploreArea}
            className={sidebarProps.className}
          />
        </div>
      ) : null}
      {signInFeature && !onGuestPersonalClick && (
        <SignInPromptModal
          feature={signInFeature}
          returnTo={
            returnToProp ?? pathname ?? (preloadedActive ? "/learn" : "/my-content")
          }
          onClose={() => setSignInFeature(null)}
        />
      )}
    </>
  );
}
