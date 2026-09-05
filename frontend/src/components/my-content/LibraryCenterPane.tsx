"use client";

import type { ReactNode } from "react";
import { useLibraryMode } from "@/hooks/useLibraryMode";
import { LibraryEmptyWorkspace } from "@/components/my-content/LibraryEmptyWorkspace";
import { ExploreMainPane } from "@/components/learn/explore/ExploreMainPane";
import { PreloadedInlineReader } from "@/components/learn/PreloadedInlineReader";
import { useOptionalPreloadedBrowse } from "@/components/learn/PreloadedBrowseContext";
import type { ExploreAreaId } from "@/lib/exploreCatalog";

type LibraryCenterPaneProps = {
  explore?: {
    subjectSlug?: string;
    topicSlug?: string;
    areaId?: ExploreAreaId | null;
    sidebarAreaId?: ExploreAreaId | null;
    returnTo: string;
  };
  /** When opening a reader doc, show this instead of the browse panes. */
  readerOverlay?: ReactNode;
};

/** Empty library mid-pane — swaps Personal vs Preloaded when no doc is open. */
export function LibraryCenterPane({
  explore,
  readerOverlay,
}: LibraryCenterPaneProps = {}) {
  const { mode, showPreloaded } = useLibraryMode();
  const browse = useOptionalPreloadedBrowse();
  const preloadedActive = showPreloaded && mode === "preloaded";
  const resolvedExplore = explore ??
    (browse
      ? {
          subjectSlug: browse.path.subjectSlug,
          topicSlug: browse.path.topicSlug,
          areaId: browse.path.subjectSlug ? null : browse.path.areaId,
          sidebarAreaId: browse.path.areaId,
          returnTo: "/my-content",
        }
      : undefined);

  if (readerOverlay) {
    return (
      <div className="library-center-pane relative h-full min-h-0 overflow-hidden">
        {readerOverlay}
      </div>
    );
  }

  return (
    <div className="library-center-pane relative h-full min-h-0 overflow-hidden">
      {!preloadedActive ? (
        <>
          <div className="library-empty-glow pointer-events-none" aria-hidden />
          <div key="personal" className="library-center-pane-swap h-full min-h-0">
            <LibraryEmptyWorkspace />
          </div>
        </>
      ) : (
        <div key="preloaded" className="library-center-pane-swap h-full min-h-0">
          {browse?.path.articleSlug &&
          browse.path.subjectSlug &&
          browse.path.topicSlug ? (
            <PreloadedInlineReader
              subjectSlug={browse.path.subjectSlug}
              topicSlug={browse.path.topicSlug}
              articleSlug={browse.path.articleSlug}
            />
          ) : (
            <ExploreMainPane
              subjectSlug={resolvedExplore?.subjectSlug}
              topicSlug={resolvedExplore?.topicSlug}
              areaId={resolvedExplore?.areaId}
              sidebarAreaId={resolvedExplore?.sidebarAreaId}
              returnTo={resolvedExplore?.returnTo ?? "/my-content"}
            />
          )}
        </div>
      )}
    </div>
  );
}
