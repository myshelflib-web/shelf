"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";

export function ShelfDrawer({
  open,
  onClose,
  children,
  side = "left",
  title,
  wide = false,
  fullScreen = false,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  side?: "left" | "right";
  title?: string;
  wide?: boolean;
  /** Phone: cover the entire viewport (above app header). */
  fullScreen?: boolean;
}) {
  if (!open) return null;

  const panelWidth = fullScreen
    ? "inset-0 w-full border-0 shelf-drawer-panel-fullscreen"
    : side === "left"
      ? "left-0 w-[min(100vw,20rem)] border-r shelf-drawer-panel-docked"
      : wide
        ? "right-0 w-full sm:w-[min(100vw,28rem)] border-l shelf-drawer-panel-docked"
        : "right-0 w-[min(100vw,20rem)] border-l shelf-drawer-panel-docked";

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        className={`shelf-drawer-backdrop fixed inset-0 bg-black/45 ${
          fullScreen ? "z-[78]" : ""
        }`}
        onClick={onClose}
      />
      <div
        className={`shelf-drawer-panel fixed flex flex-col overflow-hidden bg-[var(--bg-sidebar)] shadow-2xl ${panelWidth}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {title ? (
          <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-2.5 shrink-0 bg-[var(--bg-elevated)]">
            <span className="text-sm font-semibold text-[var(--text-primary)]">{title}</span>
            <button
              type="button"
              aria-label="Close"
              className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              onClick={onClose}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </>
  );
}
