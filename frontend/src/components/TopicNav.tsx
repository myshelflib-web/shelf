"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, CheckCircle2 } from "lucide-react";
import clsx from "clsx";

interface TopicNavProps {
  subjectSlug: string;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
  completed: boolean;
  starred: boolean;
  onToggleComplete: () => void;
  onToggleStar: () => void;
}

export function TopicNav({
  subjectSlug,
  prev,
  next,
  completed,
  starred,
  onToggleComplete,
  onToggleStar,
}: TopicNavProps) {
  return (
    <div className="border-t border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 flex items-center justify-between">
      {prev ? (
        <Link
          href={`/learn/${subjectSlug}/${prev.slug}`}
          className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition"
        >
          <ChevronLeft className="w-4 h-4" />
          {prev.title}
        </Link>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleStar}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition",
            starred
              ? "text-amber-400 bg-amber-400/15"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
          )}
        >
          <Star className={clsx("w-4 h-4", starred && "fill-amber-400 text-amber-400")} />
          Starred
        </button>
        <button
          onClick={onToggleComplete}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition",
            completed
              ? "text-[var(--accent)] bg-[var(--accent-light)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
          )}
        >
          <CheckCircle2 className="w-4 h-4" />
          {completed ? "Completed" : "Mark Complete"}
        </button>
      </div>

      {next ? (
        <Link
          href={`/learn/${subjectSlug}/${next.slug}`}
          className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition"
        >
          {next.title}
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
