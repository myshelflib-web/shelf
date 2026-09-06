"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";

/** Shared chrome for Doc research side panels — matches Shelf elevated panels. */
export function DocResearchSidePanel({
  open,
  title,
  onClose,
  side = "right",
  widthClass = "w-80",
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  side?: "left" | "right";
  widthClass?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;

  return (
    <aside
      className={clsx(
        "absolute top-0 bottom-0 z-20 flex flex-col border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_8px_30px_rgba(0,0,0,0.18)]",
        widthClass,
        side === "right" ? "right-0 border-l" : "left-0 border-r"
      )}
      aria-label={title}
    >
      <div className="flex items-center justify-between gap-2 px-3.5 py-3 border-b border-[var(--border)] shrink-0">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)] tracking-tight">
          {title}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
      {footer ? (
        <div className="shrink-0 border-t border-[var(--border)] p-3">
          {footer}
        </div>
      ) : null}
    </aside>
  );
}
