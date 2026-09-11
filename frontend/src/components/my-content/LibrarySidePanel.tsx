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
import { LibraryMode } from "@/lib/libraryMode";
import type { ExploreAreaId } from "@/lib/exploreCatalog";
import { useOptionalPreloadedBrowse } from "@/components/learn/PreloadedBrowseContext";
import { browseHref, browsePathFromHref } from "@/lib/preloadedBrowse";

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
 * Mode is user-controlled so you can browse either library while a file
 * from the other side stays open; selection follows the open document
 * only within the matching library tab.
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
  // Reader passes the open document; library home falls back to browse folder.
  const documentHref = currentHref;
  const browseFolderHref = browse ? browseHref(browse.path) : undefined;
  const resolvedHref = documentHref ?? browseFolderHref;
  const resolvedExploreArea = browse?.interceptFolderNav
    ? browse.path.areaId ?? null
    : exploreArea ?? browse?.path.areaId ?? null;
  const [signInFeature, setSignInFeature] = useState<string | null>(null);
  const setBrowsePath = browse?.setPath;

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

  // When a preloaded article is focused, expand its folder in the tree so the
  // selection is visible — without forcing the Personal/Preloaded tab.
  useEffect(() => {
    if (!setBrowsePath || !documentHref) return;
    const path = browsePathFromHref(documentHref);
    if (!path.articleSlug || !path.subjectSlug || !path.topicSlug) return;
    setBrowsePath({
      subjectSlug: path.subjectSlug,
      topicSlug: path.topicSlug,
    });
  }, [setBrowsePath, documentHref]);

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
