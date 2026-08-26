"use client";

import Link from "next/link";
import { LibraryCitation } from "@/types";

export function CitationList({
  citations,
  variant = "default",
}: {
  citations?: LibraryCitation[] | null;
  variant?: "default" | "sources-used";
}) {
  if (!citations?.length) return null;

  if (variant === "sources-used") {
    return (
      <div className="mt-2.5 pt-2.5 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-1.5">
        <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
          Sources used · {citations.length}
        </span>
        {citations.map((c) =>
          c.href ? (
            <Link
              key={`${c.pageId}-${c.n}`}
              href={c.href}
              title={c.quote || c.title}
              className="text-[9px] px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--accent)] hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-colors"
            >
              [{c.n}] {c.title}
            </Link>
          ) : (
            <span
              key={`${c.pageId}-${c.n}`}
              className="text-[9px] px-2 py-1 rounded-full border border-[var(--border)] text-[var(--text-muted)]"
            >
              [{c.n}] {c.title}
            </span>
          )
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {citations.map((c) =>
        c.href ? (
          <Link
            key={`${c.pageId}-${c.n}`}
            href={c.href}
            title={c.quote || c.title}
            className="text-[11px] px-2 py-0.5 rounded-md border border-[var(--border)] text-[var(--accent)] hover:bg-[var(--accent-subtle)]"
          >
            [{c.n}] {c.title}
          </Link>
        ) : (
          <span
            key={`${c.pageId}-${c.n}`}
            className="text-[11px] px-2 py-0.5 rounded-md border border-[var(--border)] text-[var(--text-muted)]"
          >
            [{c.n}] {c.title}
          </span>
        )
      )}
    </div>
  );
}
