"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { LibrarySidePanel } from "@/components/my-content/LibrarySidePanel";
import { LearnCatalogPane } from "@/components/learn/LearnCatalogPane";
import { LearnCollectionPane } from "@/components/learn/LearnCollectionPane";
import { SignInPromptModal } from "@/components/learn/SignInPromptModal";
import { ShelfDrawer } from "@/components/ShelfDrawer";
import { ShelfExplorerFab } from "@/components/ShelfExplorerFab";
import { useAuth } from "@/hooks/useAuth";
import { useCompactPortrait } from "@/hooks/useCompactPortrait";
import { useIsPhone } from "@/hooks/useIsPhone";
import { useLearnStudyGoal } from "@/hooks/useLearnStudyGoal";
import { useLearnSubjects } from "@/hooks/useLearnSubjects";
import {
  featuredGoalFor,
  groupSubjectsByGoal,
  matchesSearch,
  subjectHref,
  topicHref,
} from "@/lib/learnCatalog";

export function LearnBrowseWorkspace({
  subjectSlug,
  topicSlug,
}: {
  subjectSlug?: string;
  topicSlug?: string;
}) {
  const { user } = useAuth();
  const compactPortrait = useCompactPortrait();
  const isPhone = useIsPhone();
  const { goal, setGuestGoal, showGoalPicker } = useLearnStudyGoal();
  const { subjects, loading } = useLearnSubjects();
  const [search, setSearch] = useState("");
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [signInFeature, setSignInFeature] = useState<string | null>(null);

  const subject = subjects.find((s) => s.slug === subjectSlug);
  const currentHref = topicSlug && subjectSlug
    ? topicHref(subjectSlug, topicSlug)
    : subjectSlug
      ? subjectHref(subjectSlug)
      : "/learn";

  const catalogFiltered = useMemo(
    () => subjects.filter((s) => matchesSearch(s, search)),
    [subjects, search]
  );

  const featuredGoal = featuredGoalFor(goal, subject);
  const groups = useMemo(
    () => groupSubjectsByGoal(catalogFiltered, featuredGoal),
    [catalogFiltered, featuredGoal]
  );
  const collectionGroups = useMemo(
    () => groupSubjectsByGoal(subjects, featuredGoal),
    [subjects, featuredGoal]
  );

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
          {subjectSlug ? (
            <LearnCollectionPane
              subject={subject}
              topicSlug={topicSlug}
              groups={collectionGroups}
              featuredGoal={featuredGoal}
              loading={loading}
            />
          ) : (
            <LearnCatalogPane
              groups={groups}
              filterGoal={goal}
              onFilterGoalChange={setGuestGoal}
              showGoalPicker={showGoalPicker}
              search={search}
              onSearchChange={setSearch}
              loading={loading}
              signedIn={Boolean(user)}
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
