"use client";

import { ShelfBone } from "@/components/dashboard/DashboardSkeletons";
import { CircleLoader } from "@/components/CircleLoader";
import { PanelLeft, PanelRight } from "lucide-react";

/** Middle reader pane placeholder — matches LearnReaderWorkspace editor column. */
export function LearnReaderPaneSkeleton() {
  return (
    <div
      className="h-full flex flex-col min-w-0 overflow-hidden bg-[var(--bg-primary)]"
      aria-busy
      aria-label="Opening document"
    >
      <div className="reader-workspace-toolbar flex items-center gap-1 px-2 py-1 border-b border-[var(--border)] shrink-0 bg-[var(--bg-secondary)]">
        <span className="p-1.5 rounded-md text-[var(--text-muted)] opacity-40">
          <PanelLeft className="w-4 h-4" />
        </span>
        <span className="p-1.5 rounded-md text-[var(--text-muted)] opacity-40 ml-auto">
          <PanelRight className="w-4 h-4" />
        </span>
      </div>

      <div className="reader-workspace-tabs shrink-0 border-b border-[var(--border)] bg-[var(--bg-secondary)] px-2 min-h-[36px] flex items-center">
        <div className="inline-flex items-center gap-2 rounded-t-md border border-b-0 border-[var(--border)] bg-[var(--bg-primary)] px-3 py-1.5 min-w-[8rem]">
          <ShelfBone className="h-3 w-24 rounded" />
        </div>
      </div>

      <div className="doc-chrome-bar grid grid-cols-[minmax(0,1fr)_minmax(6.5rem,11rem)_minmax(0,1fr)] items-center gap-3 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-primary)] shrink-0">
        <nav className="flex items-center gap-1 min-w-0">
          <ShelfBone className="h-2.5 w-12 rounded" />
          <ShelfBone className="h-2.5 w-16 rounded" />
          <ShelfBone className="h-2.5 w-20 rounded" />
        </nav>
        <ShelfBone className="h-1.5 w-full max-w-[11rem] rounded-full justify-self-center" />
        <div />
      </div>

      <div className="flex-1 flex items-center justify-center min-h-0 bg-[var(--bg-primary)]">
        <CircleLoader size="lg" label="Loading page" />
      </div>
    </div>
  );
}
