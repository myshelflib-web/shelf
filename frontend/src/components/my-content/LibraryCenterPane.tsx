"use client";

import type { ReactNode } from "react";
import clsx from "clsx";
import { useLibraryMode } from "@/hooks/useLibraryMode";
import { LibraryEmptyWorkspace } from "@/components/my-content/LibraryEmptyWorkspace";
import { ExploreMainPane } from "@/components/learn/explore/ExploreMainPane";
import { PreloadedTabbedReader } from "@/components/learn/PreloadedTabbedReader";
import { useOptionalPreloadedBrowse } from "@/components/learn/PreloadedBrowseContext";
import { useOptionalPreloadedOpenFiles } from "@/components/learn/PreloadedOpenFilesContext";
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
  const openFiles = useOptionalPreloadedOpenFiles();
  const preloadedActive = showPreloaded && mode === "preloaded";
  const hasOpenFiles = Boolean(openFiles?.hasOpenFiles);
  const fromBrowse =
    browse?.interceptFolderNav
      ? {
          subjectSlug: browse.path.subjectSlug,
          topicSlug: browse.path.topicSlug,
          areaId: browse.path.subjectSlug ? null : browse.path.areaId,
          sidebarAreaId: browse.path.areaId,
          returnTo: explore?.returnTo ?? "/my-content",
        }
      : null;
  const resolvedExplore =
    fromBrowse ??
    explore ??
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
      <div className="library-center-pane relative flex h-full min-h-0 flex-col overflow-hidden">
        {readerOverlay}
      </div>
    );
  }

  return (
    <div className="library-center-pane relative flex h-full min-h-0 flex-col overflow-hidden">
      {!preloadedActive ? (
        <>
          <div className="library-empty-glow pointer-events-none" aria-hidden />
          <div key="personal" className="library-center-pane-swap flex-1 min-h-0">
            <LibraryEmptyWorkspace />
          </div>
        </>
      ) : (
        <div className="preloaded-center-stage">
          <div
            className={clsx(
              "preloaded-center-layer",
              hasOpenFiles && "preloaded-center-layer-hidden"
            )}
            aria-hidden={hasOpenFiles || undefined}
          >
            <div
              key={[
                resolvedExplore?.areaId ?? "",
                resolvedExplore?.subjectSlug ?? "",
                resolvedExplore?.topicSlug ?? "",
              ].join("/")}
              className="explore-folder-swap flex h-full min-h-0 flex-col overflow-hidden"
            >
              <ExploreMainPane
                subjectSlug={resolvedExplore?.subjectSlug}
                topicSlug={resolvedExplore?.topicSlug}
                areaId={resolvedExplore?.areaId}
                sidebarAreaId={resolvedExplore?.sidebarAreaId}
                returnTo={resolvedExplore?.returnTo ?? "/my-content"}
              />
            </div>
          </div>
          <div
            className={clsx(
              "preloaded-center-layer",
              !hasOpenFiles && "preloaded-center-layer-hidden"
            )}
            aria-hidden={!hasOpenFiles || undefined}
          >
            {hasOpenFiles ? <PreloadedTabbedReader /> : null}
          </div>
        </div>
      )}
    </div>
  );
}
