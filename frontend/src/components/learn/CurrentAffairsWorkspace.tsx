"use client";

import { useState } from "react";
import clsx from "clsx";
import { Header } from "@/components/Header";
import { LibrarySidePanel } from "@/components/my-content/LibrarySidePanel";
import { SignInPromptModal } from "@/components/learn/SignInPromptModal";
import { ShelfDrawer } from "@/components/ShelfDrawer";
import { ShelfExplorerFab } from "@/components/ShelfExplorerFab";
import { useCompactPortrait } from "@/hooks/useCompactPortrait";
import { useIsPhone } from "@/hooks/useIsPhone";
import { useLearnStudyGoal } from "@/hooks/useLearnStudyGoal";

export function CurrentAffairsWorkspace({
  children,
  currentHref,
}: {
  children: React.ReactNode;
  currentHref: string;
}) {
  const compactPortrait = useCompactPortrait();
  const isPhone = useIsPhone();
  const { setGuestGoal, showGoalPicker } = useLearnStudyGoal();
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [signInFeature, setSignInFeature] = useState<string | null>(null);

  const libraryExplorer = (
    <LibrarySidePanel
      currentHref={currentHref}
      workspaceMode={false}
      showGoalPicker={showGoalPicker}
      onStudyGoalChange={setGuestGoal}
      onGuestPersonalClick={() => setSignInFeature("Your personal library")}
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
            compactPortrait && "pt-10"
          )}
        >
          {compactPortrait && !explorerOpen ? (
            <ShelfExplorerFab onClick={() => setExplorerOpen(true)} />
          ) : null}
          {children}
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
