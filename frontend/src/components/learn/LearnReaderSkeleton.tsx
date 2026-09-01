"use client";

import { CircleLoader } from "@/components/CircleLoader";
import { PanelLeft, PanelRight } from "lucide-react";

/** Middle reader pane while a preloaded PDF opens — matches DocumentPane loading. */
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
      <div className="reader-workspace-tabs shrink-0 border-b border-[var(--border)] bg-[var(--bg-secondary)] min-h-[36px]" />
      <div className="flex-1 flex items-center justify-center min-h-0">
        <CircleLoader size="lg" label="Loading page" />
      </div>
    </div>
  );
}
