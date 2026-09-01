"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { ThinkingIndicator } from "@/components/GreetingAccent";
import { LibrarySidePanel } from "@/components/my-content/LibrarySidePanel";
import { ExploreMainPane } from "@/components/learn/explore/ExploreMainPane";
import { SignInPromptModal } from "@/components/learn/SignInPromptModal";
import { ShelfDrawer } from "@/components/ShelfDrawer";
import { ShelfExplorerFab } from "@/components/ShelfExplorerFab";
import { useCompactPortrait } from "@/hooks/useCompactPortrait";
import { useIsPhone } from "@/hooks/useIsPhone";
import { useLearnStudyGoal } from "@/hooks/useLearnStudyGoal";
import { subjectHref, topicHref } from "@/lib/learnCatalog";
import { areaForGoal } from "@/lib/exploreCatalog";
import { parseExploreAreaFromSearch } from "@/components/learn/explore/ExploreSidebarBrowse";
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
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [signInFeature, setSignInFeature] = useState<string | null>(null);

  const areaFromQuery = parseExploreAreaFromSearch(searchParams.get("area"));
  const activeArea =
    subjectSlug || topicSlug
      ? null
      : areaFromQuery ?? (initialGoal ? areaForGoal(initialGoal) : null);

  const currentHref =
    topicSlug && subjectSlug
      ? topicHref(subjectSlug, topicSlug)
      : subjectSlug
        ? subjectHref(subjectSlug)
        : activeArea
          ? `/learn?area=${activeArea}`
          : "/learn";

  const libraryExplorer = (
    <LibrarySidePanel
      currentHref={currentHref}
      workspaceMode={false}
      showGoalPicker={showGoalPicker}
      onStudyGoalChange={setGuestGoal}
      onGuestPersonalClick={() => setSignInFeature("Your personal library")}
      exploreArea={activeArea}
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
          className={`flex-1 min-h-0 overflow-hidden bg-[var(--bg-primary)] relative ${
            compactPortrait ? "pt-10" : ""
          }`}
        >
          {compactPortrait && !explorerOpen ? (
            <ShelfExplorerFab onClick={() => setExplorerOpen(true)} />
          ) : null}
          <ExploreMainPane
            subjectSlug={subjectSlug}
            topicSlug={topicSlug}
            areaId={activeArea}
            returnTo={currentHref}
          />
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
