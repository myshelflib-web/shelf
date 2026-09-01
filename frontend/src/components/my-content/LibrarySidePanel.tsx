"use client";

import { ReactNode, useCallback, useState } from "react";
import { usePathname } from "next/navigation";
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
 * Personal vs Preloaded explorer. Tabs appear for non-General study goals.
 * Guests stay on Preloaded; Personal opens a sign-in prompt.
 */
export function LibrarySidePanel(props: LibrarySidePanelProps) {
  const {
    onGuestPersonalClick,
    exploreArea,
    returnTo: returnToProp,
    showGoalPicker,
    onStudyGoalChange,
    ...sidebarProps
  } = props;

  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { mode, setMode, showPreloaded, goal, isGuest } = useLibraryMode();
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

  const tabs: ReactNode = showPreloaded ? (
    <LibraryModeTabs
      mode={mode}
      onChange={handleModeChange}
      showPreloaded={showPreloaded}
    />
  ) : null;

  if (mode === "preloaded" && showPreloaded) {
    return (
      <>
        <PreloadedLibrarySidebar
          mode={mode}
          onModeChange={handleModeChange}
          showPreloaded={showPreloaded}
          studyGoal={goal}
          currentHref={sidebarProps.currentHref}
          workspaceMode={sidebarProps.workspaceMode}
          showGoalPicker={Boolean(showGoalPicker) && isGuest}
          onStudyGoalChange={onStudyGoalChange}
          onOpenPage={sidebarProps.onOpenPage}
          onGuestLibraryClick={
            onGuestPersonalClick ?? (() => setSignInFeature("Your personal library"))
          }
          exploreArea={exploreArea}
          className={sidebarProps.className}
        />
        {signInFeature && !onGuestPersonalClick && (
          <SignInPromptModal
            feature={signInFeature}
            returnTo={returnToProp ?? pathname ?? "/learn"}
            onClose={() => setSignInFeature(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <MyContentSidebar {...sidebarProps} libraryModeTabs={tabs} />
      {signInFeature && !onGuestPersonalClick && (
        <SignInPromptModal
          feature={signInFeature}
          returnTo={returnToProp ?? pathname ?? "/my-content"}
          onClose={() => setSignInFeature(null)}
        />
      )}
    </>
  );
}
