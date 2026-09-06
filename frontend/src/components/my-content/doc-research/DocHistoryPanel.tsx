"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { diffLines } from "./docDiff";

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
  const [diffText, setDiffText] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    void api.myContent.listRevisions(pageId).then((r) => setRows(r.revisions));
  }, [open, pageId]);

  if (!open) return null;

  async function preview(id: string) {
    const { revision } = await api.myContent.getRevision(pageId, id);
    const a = strip(currentHtml);
    const b = strip(revision.html);
    setDiffText(diffLines(a, b));
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
    <div className="absolute right-0 top-0 bottom-0 z-20 w-80 border-l border-[var(--border)] bg-[var(--bg-elevated)] flex flex-col shadow-lg">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
        <h3 className="text-xs font-semibold">History</h3>
        <button type="button" className="text-xs text-[var(--text-muted)]" onClick={onClose}>
          Close
        </button>
      </div>
      <ul className="max-h-40 overflow-y-auto border-b border-[var(--border)] p-2 space-y-1">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center gap-1">
            <button
              type="button"
              className="flex-1 text-left text-[11px] text-[var(--text-secondary)] hover:text-[var(--accent)]"
              onClick={() => void preview(r.id)}
            >
              {r.label || "Snapshot"} ·{" "}
              {new Date(r.createdAt).toLocaleString()}
            </button>
            <button
              type="button"
              className="text-[10px] text-[var(--accent)]"
              onClick={() => void restore(r.id)}
            >
              Restore
            </button>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="text-[11px] text-[var(--text-muted)]">No snapshots yet.</li>
        )}
      </ul>
      <pre className="flex-1 overflow-auto p-2 text-[10px] text-[var(--text-secondary)] whitespace-pre-wrap">
        {diffText || "Select a snapshot to compare with the current draft."}
      </pre>
    </div>
  );
}

function strip(html: string): string {
  const d = document.createElement("div");
  d.innerHTML = html;
  return d.innerText || "";
}
