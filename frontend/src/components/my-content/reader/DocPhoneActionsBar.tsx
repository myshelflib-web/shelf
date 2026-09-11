"use client";

import { Share2, Star, Trash2 } from "lucide-react";

/** Compact star/share/delete row for non-PDF docs on phone (doc-chrome-bar is CSS-hidden). */
export function DocPhoneActionsBar({
  starred,
  onToggleStar,
  onShare,
  onDelete,
}: {
  starred: boolean;
  onToggleStar?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
}) {
  if (!onToggleStar && !onShare && !onDelete) return null;

  return (
    <div
      className="doc-phone-actions flex items-center justify-end gap-0.5 px-2 py-1 border-b border-[var(--border)] bg-[var(--bg-elevated)] shrink-0 md:hidden"
      data-tour-id="doc-phone-actions"
    >
      {onShare ? (
        <button
          type="button"
          className="h-10 w-10 inline-flex items-center justify-center rounded-lg text-[var(--text-muted)]"
          aria-label="Share"
          onClick={onShare}
        >
          <Share2 className="w-4 h-4" aria-hidden />
        </button>
      ) : null}
      {onToggleStar ? (
        <button
          type="button"
          className={`h-10 w-10 inline-flex items-center justify-center rounded-lg ${
            starred ? "text-amber-400" : "text-[var(--text-muted)]"
          }`}
          aria-label={starred ? "Unstar" : "Star"}
          onClick={() => {
          void import("@/lib/capacitorNative").then(({ hapticLight }) =>
            hapticLight()
          );
          onToggleStar?.();
        }}
        >
          <Star className={`w-4 h-4 ${starred ? "fill-current" : ""}`} aria-hidden />
        </button>
      ) : null}
      {onDelete ? (
        <button
          type="button"
          className="h-10 w-10 inline-flex items-center justify-center rounded-lg text-[var(--text-muted)]"
          aria-label="Delete"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
