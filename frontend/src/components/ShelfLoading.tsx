"use client";

import { ShelfLogo } from "@/components/ShelfLogo";

/**
 * Full-screen / route brand loader — animated Shelf mark + caption.
 * Prefer this over ThinkingIndicator for app chrome loading states.
 */
export function ShelfLoading({
  label = "Shelf is loading",
  className = "",
  size = 96,
}: {
  label?: string;
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-5 text-center ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <ShelfLogo size={size} lively />
      <p className="shelf-loading-label text-base sm:text-lg text-[var(--text-muted)] tracking-tight">
        {label}
        <span className="shelf-loading-ellipsis" aria-hidden>
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </p>
    </div>
  );
}
