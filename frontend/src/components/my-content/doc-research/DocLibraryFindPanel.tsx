"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { insertHtmlAtSelection } from "@/lib/docResearchMarkup";
import { DocResearchSidePanel } from "./DocResearchSidePanel";

type Props = {
  open: boolean;
  onClose: () => void;
  onInserted: () => void;
};

type Hit = {
  id: string;
  title: string;
  text?: string;
};

export function DocLibraryFindPanel({ open, onClose, onInserted }: Props) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);

  useEffect(() => {
    if (!open || q.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await api.study.libraryAsk({ query: q.trim() });
          setHits(
            (res.citations || []).slice(0, 12).map((c) => ({
              id: c.pageId,
              title: c.title,
              text: c.quote,
            }))
          );
        } catch {
          setHits([]);
        }
      })();
    }, 280);
    return () => window.clearTimeout(t);
  }, [open, q]);

  return (
    <DocResearchSidePanel
      open={open}
      title="Find in library"
      onClose={onClose}
      side="left"
    >
      <div className="p-3 border-b border-[var(--border)]">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search notes & PDFs…"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>
      <ul className="p-2.5 space-y-1.5">
        {hits.map((h, i) => (
          <li key={`${h.id}-${i}`}>
            <button
              type="button"
              className="w-full text-left rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-2 hover:border-[var(--accent)]/50"
              onClick={() => {
                const quote = (h.text || "").trim();
                if (!quote) return;
                insertHtmlAtSelection(
                  `<blockquote><p>${quote.replace(/</g, "&lt;")}</p><footer>${h.title.replace(/</g, "&lt;")}</footer></blockquote>`
                );
                onInserted();
              }}
            >
              <p className="text-[12px] font-medium text-[var(--text-primary)] line-clamp-1">
                {h.title}
              </p>
              {h.text && (
                <p className="text-[11px] text-[var(--text-muted)] line-clamp-3 mt-0.5">
                  {h.text}
                </p>
              )}
            </button>
          </li>
        ))}
        {open && q.trim().length >= 2 && hits.length === 0 && (
          <li className="text-[12px] text-[var(--text-muted)] px-1 py-2">
            No matches yet.
          </li>
        )}
      </ul>
    </DocResearchSidePanel>
  );
}
