"use client";

import { Info } from "lucide-react";

export function InfoTip({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={`relative inline-flex group ${className}`}>
      <button
        type="button"
        aria-label="More info"
        className="p-0.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 w-52 px-2.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[11px] leading-relaxed text-[var(--text-secondary)] shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity"
      >
        {text}
      </span>
    </span>
  );
}
