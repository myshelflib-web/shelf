"use client";

import Link from "next/link";
import { FolderMark } from "@/components/FolderMark";
import { DashboardNotebooksSkeleton } from "@/components/dashboard/DashboardSkeletons";
import { UserSubject } from "@/types";
import { countPages, flattenPages } from "@/lib/myContentTree";
import { getNotebookLastRead } from "@/lib/tabViewState";
import { formatOpenedAgo } from "@/lib/relativeDay";

function notebookHref(notebook: UserSubject): string {
  const last = getNotebookLastRead(notebook.slug);
  if (last?.href) return last.href;
  const first = flattenPages(notebook)[0];
  return first?.href ?? "/my-content";
}

function notebookMeta(notebook: UserSubject): string {
  const pages = countPages(notebook);
  const pageLabel = `${pages} ${pages === 1 ? "page" : "pages"}`;
  const last = getNotebookLastRead(notebook.slug);
  if (last?.viewedAt) {
    return `${pageLabel} · ${formatOpenedAgo(last.viewedAt)}`;
  }
  return pageLabel;
}

export function DashboardNotebooks({
  notebooks,
  loading = false,
}: {
  notebooks: UserSubject[];
  loading?: boolean;
}) {
  if (loading) return <DashboardNotebooksSkeleton />;
  if (notebooks.length === 0) return null;

  return (
    <section className="shrink-0">
      <div className="flex items-center justify-between gap-4 mb-3">
        <h2 className="text-[15px] font-semibold tracking-tight">
          Your collections
        </h2>
        <Link
          href="/my-content"
          className="text-xs text-[var(--text-muted)] hover:text-[var(--accent)] whitespace-nowrap"
        >
          View library →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {notebooks.map((notebook) => (
          <Link
            key={notebook.id}
            href={notebookHref(notebook)}
            className="min-h-[6.1rem] rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-[var(--text-primary)] transition hover:bg-[var(--bg-secondary)] hover:border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] hover:-translate-y-px"
          >
            <div className="flex items-center gap-2.5 mb-4 min-w-0">
              <FolderMark seed={notebook.id} size={14} />
              <span className="font-semibold text-[13px] truncate">
                {notebook.name}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              {notebookMeta(notebook)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
