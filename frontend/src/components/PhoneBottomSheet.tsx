"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

/** Phone-first bottom sheet (search, more menu, move-day, open tabs). */
export function PhoneBottomSheet({
  open,
  onClose,
  title,
  children,
  tall = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  tall?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="phone-bottom-sheet" data-tour-id="phone-bottom-sheet">
      <button
        type="button"
        className="phone-bottom-sheet-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={`phone-bottom-sheet-panel${tall ? " phone-bottom-sheet-panel-tall" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Sheet"}
      >
        <div className="phone-bottom-sheet-handle" aria-hidden />
        {title ? (
          <div className="phone-bottom-sheet-header">
            <h2 className="phone-bottom-sheet-title">{title}</h2>
            <button
              type="button"
              aria-label="Close"
              className="rounded-md p-2 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              onClick={onClose}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : null}
        <div className="phone-bottom-sheet-body">{children}</div>
      </div>
    </div>
  );
}
