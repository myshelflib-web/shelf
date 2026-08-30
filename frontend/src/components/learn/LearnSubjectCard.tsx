"use client";

import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { FolderMark } from "@/components/FolderMark";
import { subjectHref } from "@/lib/learnCatalog";
import { Subject } from "@/types";
import clsx from "clsx";

export function LearnSubjectCard({
  subject,
  compact = false,
}: {
  subject: Subject;
  compact?: boolean;
}) {
  const topicCount = subject.topics.length;
  const articleCount = subject.topics.reduce(
    (n, t) => n + (t.articles?.length ?? 0),
    0
  );

  return (
    <Link
      href={subjectHref(subject.slug)}
      className={clsx(
        "group h-full min-h-[6.1rem] flex flex-col rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-[var(--text-primary)] transition hover:bg-[var(--bg-secondary)] hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] hover:-translate-y-px",
        compact && "min-h-[5.25rem] p-3.5"
      )}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        {subject.icon ? (
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-[var(--bg-secondary)] text-base shrink-0"
            aria-hidden
          >
            {subject.icon}
          </span>
        ) : (
          <FolderMark seed={subject.id} size={14} />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[13px] truncate leading-tight">
            {subject.name}
          </p>
          {subject.description ? (
            <p className="mt-1.5 text-[11px] leading-snug text-[var(--text-muted)] line-clamp-2 min-h-[2.1em]">
              {subject.description}
            </p>
          ) : (
            <p className="mt-1.5 text-[11px] leading-snug text-[var(--text-muted)] min-h-[2.1em]">
              Preloaded collection
            </p>
          )}
        </div>
        <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-transform group-hover:translate-x-0.5" />
      </div>
      <p className="mt-auto pt-3 text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
        <BookOpen className="w-3 h-3" aria-hidden />
        {topicCount} topic{topicCount === 1 ? "" : "s"} · {articleCount}{" "}
        article{articleCount === 1 ? "" : "s"}
      </p>
    </Link>
  );
}
