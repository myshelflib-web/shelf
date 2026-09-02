"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Header } from "@/components/Header";
import { ThinkingIndicator } from "@/components/GreetingAccent";
import { LibrarySidePanel } from "@/components/my-content/LibrarySidePanel";
import { ExploreMainPane } from "@/components/learn/explore/ExploreMainPane";
import { useLearnNavigation } from "@/components/learn/LearnNavigationProvider";
import { LearnReaderPaneSkeleton } from "@/components/learn/LearnReaderSkeleton";
import { SignInPromptModal } from "@/components/learn/SignInPromptModal";
import { ShelfDrawer } from "@/components/ShelfDrawer";
import { ShelfExplorerFab } from "@/components/ShelfExplorerFab";
import { useCompactPortrait } from "@/hooks/useCompactPortrait";
import { useIsPhone } from "@/hooks/useIsPhone";
import { useLearnStudyGoal } from "@/hooks/useLearnStudyGoal";
import { subjectGoal, subjectHref, topicHref } from "@/lib/learnCatalog";
import { areaForGoal } from "@/lib/exploreCatalog";
import { parseExploreAreaFromSearch } from "@/components/learn/explore/ExploreSidebarBrowse";
import { useLearnSubjects } from "@/hooks/useLearnSubjects";
import { StudyGoal } from "@/types";

export function LearnBrowseWorkspace(props: {
  subjectSlug?: string;
  topicSlug?: string;
  /** Pre-select a study track (e.g. /learn/tracks/gate). */
  initialGoal?: StudyGoal;
}) {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <ThinkingIndicator label="Loading" />
        </div>
      }
    >
      <LearnBrowseWorkspaceInner {...props} />
    </Suspense>
  );
}

function LearnBrowseWorkspaceInner({
  subjectSlug,
  topicSlug,
  initialGoal,
}: {
  subjectSlug?: string;
  topicSlug?: string;
  initialGoal?: StudyGoal;
}) {
  const compactPortrait = useCompactPortrait();
  const isPhone = useIsPhone();
  const searchParams = useSearchParams();
  const { setGuestGoal, showGoalPicker } = useLearnStudyGoal(initialGoal);
  const { openingReader, returningToBrowse, completeBrowseReturn } =
    useLearnNavigation();
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [signInFeature, setSignInFeature] = useState<string | null>(null);

  useEffect(() => {
    if (!returningToBrowse) return;
    const timeout = window.setTimeout(() => completeBrowseReturn(), 320);
    return () => window.clearTimeout(timeout);
  }, [returningToBrowse, completeBrowseReturn]);

  const { subjects } = useLearnSubjects();
  const areaFromQuery = parseExploreAreaFromSearch(searchParams.get("area"));
  const browseSubject = subjectSlug
    ? subjects.find((s) => s.slug === subjectSlug)
    : undefined;
  const sidebarExploreArea =
    areaFromQuery ??
    (browseSubject ? areaForGoal(subjectGoal(browseSubject)) : null);
  const mainPaneAreaId = areaFromQuery;

  const currentHref =
    topicSlug && subjectSlug
      ? topicHref(subjectSlug, topicSlug)
      : subjectSlug
        ? subjectHref(subjectSlug)
        : mainPaneAreaId
          ? `/learn?area=${mainPaneAreaId}`
          : "/learn";

  const libraryExplorer = (
    <LibrarySidePanel
      currentHref={currentHref}
      workspaceMode={false}
      showGoalPicker={showGoalPicker}
      onStudyGoalChange={setGuestGoal}
      onGuestPersonalClick={() => setSignInFeature("Your personal library")}
      exploreArea={sidebarExploreArea}
      returnTo={currentHref}
      className={compactPortrait ? "w-full border-r-0" : undefined}
    />
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden min-h-0">
        {!compactPortrait ? (
          <div className="h-full w-72 shrink-0">{libraryExplorer}</div>
        ) : null}
        <main
          className={clsx(
            "flex-1 min-h-0 overflow-hidden bg-[var(--bg-primary)] relative",
            compactPortrait && "pt-10",
            returningToBrowse && "learn-browse-pane-enter"
          )}
        >
          {compactPortrait && !explorerOpen ? (
            <ShelfExplorerFab onClick={() => setExplorerOpen(true)} />
          ) : null}
          {openingReader ? (
            <LearnReaderPaneSkeleton />
          ) : (
            <ExploreMainPane
              subjectSlug={subjectSlug}
              topicSlug={topicSlug}
              areaId={mainPaneAreaId}
              sidebarAreaId={sidebarExploreArea}
              returnTo={currentHref}
            />
          )}
        </main>
      </div>

      <ShelfDrawer
        open={compactPortrait && explorerOpen}
        onClose={() => setExplorerOpen(false)}
        title="Explorer"
        fullScreen={isPhone}
      >
        {libraryExplorer}
      </ShelfDrawer>

      {signInFeature && (
        <SignInPromptModal
          feature={signInFeature}
          returnTo={currentHref}
          onClose={() => setSignInFeature(null)}
        />
      )}
    </div>
  );
}
