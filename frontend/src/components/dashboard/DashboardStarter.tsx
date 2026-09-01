"use client";

import { useAddContent } from "@/components/my-content/MyContentAddProvider";

export function DashboardStarter() {
  const { openAdd } = useAddContent();

  return (
    <section>
      <div className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--accent)] mb-1.5">
              Start here
            </p>
            <h2 className="text-lg font-semibold tracking-tight mb-1.5">
              Add your first study material
            </h2>
            <p className="text-[12.5px] text-[var(--text-muted)]">
              Upload a PDF or document to start building your library. Shelf can
              then help you read, search, organise and use AI around your
              material.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => openAdd({ kind: "page", pageMode: "file" })}
              className="rounded-lg bg-[var(--accent)] text-white text-xs font-semibold px-3.5 py-2 hover:opacity-90"
            >
              Add material
            </button>
            <button
              type="button"
              onClick={() => openAdd({ kind: "notebook" })}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-xs font-semibold px-3.5 py-2 hover:border-[var(--accent)]/40"
            >
              Create blank folder
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
