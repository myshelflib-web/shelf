"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { LibrarySidePanel } from "@/components/my-content/LibrarySidePanel";
import { LearnGuestWorkspace } from "@/components/learn/LearnGuestWorkspace";
import { SignInPromptModal } from "@/components/learn/SignInPromptModal";
import { ShelfDrawer } from "@/components/ShelfDrawer";
import { ShelfExplorerFab } from "@/components/ShelfExplorerFab";
import { useCompactPortrait } from "@/hooks/useCompactPortrait";
import { useIsPhone } from "@/hooks/useIsPhone";
import { useLearnStudyGoal } from "@/hooks/useLearnStudyGoal";
import { subjectHref, topicHref } from "@/lib/learnCatalog";
import { StudyGoal } from "@/types";

export function LearnBrowseWorkspace({
  subjectSlug,
  topicSlug,
  initialGoal,
}: {
  subjectSlug?: string;
  topicSlug?: string;
  /** Pre-select a study track (e.g. /learn/tracks/gate). */
  initialGoal?: StudyGoal;
}) {
  const compactPortrait = useCompactPortrait();
  const isPhone = useIsPhone();
  const { setGuestGoal, showGoalPicker } = useLearnStudyGoal(initialGoal);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [signInFeature, setSignInFeature] = useState<string | null>(null);

  const currentHref =
    topicSlug && subjectSlug
      ? topicHref(subjectSlug, topicSlug)
      : subjectSlug
        ? subjectHref(subjectSlug)
        : "/learn";

  const libraryExplorer = (
    <LibrarySidePanel
      currentHref={currentHref}
      workspaceMode={false}
      showGoalPicker={showGoalPicker}
      onStudyGoalChange={setGuestGoal}
      onGuestPersonalClick={() =>
        setSignInFeature("Your personal library")
      }
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
          <LearnGuestWorkspace />
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
