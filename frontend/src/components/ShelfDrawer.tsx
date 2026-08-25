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
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  side?: "left" | "right";
  title?: string;
  wide?: boolean;
}) {
  if (!open) return null;

  const panelClass =
    side === "left"
      ? "left-0 w-[min(100vw,20rem)]"
      : wide
        ? "right-0 w-[min(100vw,28rem)]"
        : "right-0 w-[min(100vw,20rem)]";

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        className="fixed inset-0 z-[60] bg-black/45"
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 z-[61] flex flex-col overflow-hidden border-[var(--border)] bg-[var(--bg-sidebar)] shadow-2xl ${panelClass} ${
          side === "left" ? "border-r" : "border-l"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {title ? (
          <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-2 shrink-0 bg-[var(--bg-elevated)]">
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
