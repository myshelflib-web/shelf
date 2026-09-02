"use client";

import clsx from "clsx";
import { useLibraryMode } from "@/hooks/useLibraryMode";
import { LibraryEmptyWorkspace } from "@/components/my-content/LibraryEmptyWorkspace";
import { ExploreMainPane } from "@/components/learn/explore/ExploreMainPane";

/** Empty library mid-pane — crossfades Personal vs Preloaded when no doc is open. */
export function LibraryCenterPane() {
  const { mode, showPreloaded } = useLibraryMode();
  const preloadedActive = showPreloaded && mode === "preloaded";

  return (
    <div className="library-center-pane relative h-full min-h-0">
      <div className="library-empty-glow pointer-events-none" aria-hidden />
      <div
        className={clsx(
          "library-center-pane-layer",
          preloadedActive
            ? "library-center-pane-layer-idle"
            : "library-center-pane-layer-active"
        )}
      >
        <LibraryEmptyWorkspace />
      </div>
      {showPreloaded ? (
        <div
          className={clsx(
            "library-center-pane-layer",
            preloadedActive
              ? "library-center-pane-layer-active"
              : "library-center-pane-layer-idle"
          )}
        >
          <ExploreMainPane returnTo="/my-content" />
        </div>
      ) : null}
    </div>
  );
}
