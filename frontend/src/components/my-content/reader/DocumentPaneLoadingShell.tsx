"use client";

import { CircleLoader } from "@/components/CircleLoader";

/** Chrome-first shell while page metadata loads — avoids a blank full-pane wait. */
export function DocumentPaneLoadingShell({
  title,
  showChrome,
}: {
  title?: string;
  showChrome: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {showChrome && title ? (
        <div className="shrink-0 border-b border-[var(--border)] px-4 py-2.5">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
            {title}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Opening document…
          </p>
        </div>
      ) : null}
      <div className="flex-1 flex items-center justify-center">
        <CircleLoader size="lg" label="Loading page" />
      </div>
    </div>
  );
}
