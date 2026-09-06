"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { diffLines } from "./docDiff";
import { DocResearchSidePanel } from "./DocResearchSidePanel";

type Props = {
  pageId: string;
  open: boolean;
  onClose: () => void;
  currentHtml: string;
  onRestore: (html: string) => void;
};

export function DocHistoryPanel({
  pageId,
  open,
  onClose,
  currentHtml,
  onRestore,
}: Props) {
  const [rows, setRows] = useState<
    Array<{ id: string; label: string | null; createdAt: string }>
  >([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [diffText, setDiffText] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    void api.myContent.listRevisions(pageId).then((r) => setRows(r.revisions));
    setSelected(null);
    setDiffText(null);
  }, [open, pageId]);

  async function preview(id: string) {
    setSelected(id);
    const { revision } = await api.myContent.getRevision(pageId, id);
    setDiffText(diffLines(strip(currentHtml), strip(revision.html)));
  }

  async function restore(id: string) {
    const { html } = await api.myContent.restoreRevision(
      pageId,
      id,
      currentHtml
    );
    onRestore(html);
    onClose();
  }

  return (
    <DocResearchSidePanel open={open} title="Version history" onClose={onClose}>
      <div className="p-2.5 space-y-1.5 border-b border-[var(--border)]">
        {rows.map((r) => (
          <div
            key={r.id}
            className={`rounded-xl border px-2.5 py-2 ${
              selected === r.id
                ? "border-[var(--accent)] bg-[var(--accent-light)]"
                : "border-[var(--border)] bg-[var(--bg-secondary)]"
            }`}
          >
            <button
              type="button"
              className="w-full text-left"
              onClick={() => void preview(r.id)}
            >
              <p className="text-[12px] font-medium text-[var(--text-primary)]">
                {r.label || "Autosaved snapshot"}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                {new Date(r.createdAt).toLocaleString()}
              </p>
            </button>
            <button
              type="button"
              className="mt-1.5 text-[11px] font-semibold text-[var(--accent)]"
              onClick={() => void restore(r.id)}
            >
              Restore this version
            </button>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-[12px] text-[var(--text-muted)] px-1 py-2">
            Snapshots appear as you edit and save.
          </p>
        )}
      </div>
      <pre className="p-3 text-[11px] leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap font-mono">
        {diffText || "Select a snapshot to compare with the current draft."}
      </pre>
    </DocResearchSidePanel>
  );
}

function strip(html: string): string {
  const d = document.createElement("div");
  d.innerHTML = html;
  return d.innerText || "";
}
