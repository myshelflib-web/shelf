"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { DashboardContinueSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { LastRead } from "@/lib/tabViewState";
import { formatLastStudied } from "@/lib/relativeDay";

export function DashboardContinue({
  lastRead,
  notebookName,
  pdfPage,
  loading = false,
}: {
  lastRead?: LastRead | null;
  notebookName?: string | null;
  pdfPage?: number;
  loading?: boolean;
}) {
  if (loading) return <DashboardContinueSkeleton />;
  if (!lastRead?.href) return null;
  const eyebrow = notebookName
    ? `Collection · ${notebookName}`
    : lastRead.notebookSlug
      ? "Collection"
      : "Library";
  const studied = lastRead.viewedAt
    ? formatLastStudied(lastRead.viewedAt)
    : null;
  const meta = [
    typeof pdfPage === "number" && pdfPage > 0 ? `Page ${pdfPage}` : null,
    studied,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-semibold tracking-tight">
          Continue where you left off
        </h2>
      </div>
      <Link
        href={lastRead.href}
        className="group flex items-center gap-4 rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-4 transition-colors hover:bg-[var(--bg-secondary)] hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--border))]"
      >
        <span className="w-10 h-12 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--accent)] inline-flex items-center justify-center shrink-0">
          <FileText className="w-[18px] h-[18px]" strokeWidth={1.7} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] text-[var(--text-muted)] mb-0.5">
            {eyebrow}
          </span>
          <span className="block text-[15px] font-semibold truncate">
            {lastRead.title || "Last page"}
          </span>
          {meta ? (
            <span className="block text-xs text-[var(--text-muted)] mt-0.5">
              {meta}
            </span>
          ) : null}
        </span>
        <span className="shrink-0 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold px-3.5 py-2">
          Continue →
        </span>
      </Link>
    </section>
  );
}
