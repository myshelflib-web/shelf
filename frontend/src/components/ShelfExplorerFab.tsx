"use client";

import { PanelLeft } from "lucide-react";

export function ShelfExplorerFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute left-3 top-2 z-10 inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] shadow-sm hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
      aria-label="Open library explorer"
    >
      <PanelLeft className="h-3.5 w-3.5" aria-hidden />
      Explorer
    </button>
  );
}
