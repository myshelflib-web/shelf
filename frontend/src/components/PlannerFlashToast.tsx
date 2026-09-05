"use client";

import { X } from "lucide-react";

export function shortPlannerTitle(title: string, max = 32) {
  const t = title.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function PlannerFlashToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      className="pointer-events-auto fixed bottom-6 left-1/2 z-[200] w-[min(100%,24rem)] -translate-x-1/2 px-3"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-2 rounded-[10px] border border-red-500/35 bg-[var(--bg-elevated)] px-3.5 py-3 shadow-xl">
        <p className="min-w-0 flex-1 text-sm font-medium text-red-400">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
