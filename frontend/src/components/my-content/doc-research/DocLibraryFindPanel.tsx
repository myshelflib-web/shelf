"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { insertHtmlAtSelection } from "@/lib/docResearchMarkup";

type Props = {
  open: boolean;
  onClose: () => void;
  onInserted: () => void;
};

type Hit = {
  id: string;
  title: string;
  text?: string;
  pageNumber?: number | null;
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
          // Reuse library ask / search via study libraryAsk for excerpts
          const res = await api.study.libraryAsk({ query: q.trim() });
          const citations = res.citations || [];
          setHits(
            citations.slice(0, 12).map((c) => ({
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

  if (!open) return null;

  return (
    <div className="absolute left-0 top-0 bottom-0 z-20 w-72 border-r border-[var(--border)] bg-[var(--bg-elevated)] flex flex-col shadow-lg">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
        <h3 className="text-xs font-semibold">Find in library</h3>
        <button type="button" className="text-xs text-[var(--text-muted)]" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="p-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search notes & PDFs…"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1.5 text-xs"
        />
      </div>
      <ul className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {hits.map((h, i) => (
          <li key={`${h.id}-${i}`}>
            <button
              type="button"
              className="w-full text-left rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1.5"
              onClick={() => {
                const quote = (h.text || "").trim();
                if (quote) {
                  insertHtmlAtSelection(
                    `<blockquote><p>${quote.replace(/</g, "&lt;")}</p><footer>${h.title.replace(/</g, "&lt;")}</footer></blockquote>`
                  );
                  onInserted();
                }
              }}
            >
              <p className="text-xs font-medium line-clamp-1">{h.title}</p>
              {h.text && (
                <p className="text-[10px] text-[var(--text-muted)] line-clamp-3 mt-0.5">
                  {h.text}
                </p>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
