"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { PageComment } from "@/lib/researchDocTypes";

type Props = {
  pageId: string;
  open: boolean;
  onClose: () => void;
  selectionQuote?: string;
};

export function DocCommentsPanel({
  pageId,
  open,
  onClose,
  selectionQuote,
}: Props) {
  const [comments, setComments] = useState<PageComment[]>([]);
  const [canWrite, setCanWrite] = useState(false);
  const [body, setBody] = useState("");

  const reload = useCallback(() => {
    void api.myContent.listComments(pageId).then((r) => {
      setComments(r.comments);
      setCanWrite(r.canWrite);
    });
  }, [pageId]);

  useEffect(() => {
    if (!open) return;
    reload();
  }, [open, reload]);

  if (!open) return null;

  async function submit() {
    if (!body.trim() || !canWrite) return;
    await api.myContent.createComment(pageId, {
      body: body.trim(),
      anchorQuote: selectionQuote,
    });
    setBody("");
    reload();
  }

  return (
    <div className="absolute right-0 top-0 bottom-0 z-20 w-72 border-l border-[var(--border)] bg-[var(--bg-elevated)] flex flex-col shadow-lg">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
        <h3 className="text-xs font-semibold">Comments</h3>
        <button type="button" className="text-xs text-[var(--text-muted)]" onClick={onClose}>
          Close
        </button>
      </div>
      {selectionQuote && (
        <p className="px-3 py-2 text-[10px] text-[var(--text-muted)] border-b border-[var(--border)] line-clamp-3">
          Re: “{selectionQuote}”
        </p>
      )}
      <ul className="flex-1 overflow-y-auto p-2 space-y-2">
        {comments.map((c) => (
          <li
            key={c.id}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-2"
          >
            <p className="text-[10px] text-[var(--text-muted)]">
              {c.user?.name || "User"} ·{" "}
              {new Date(c.createdAt).toLocaleString()}
              {c.resolvedAt ? " · resolved" : ""}
            </p>
            {c.anchorQuote && (
              <p className="text-[10px] text-[var(--text-secondary)] italic line-clamp-2">
                “{c.anchorQuote}”
              </p>
            )}
            <p className="text-xs text-[var(--text-primary)] mt-1">{c.body}</p>
            {canWrite && !c.resolvedAt && (
              <button
                type="button"
                className="mt-1 text-[10px] text-[var(--accent)]"
                onClick={() =>
                  void api.myContent
                    .updateComment(pageId, c.id, { resolved: true })
                    .then(reload)
                }
              >
                Resolve
              </button>
            )}
          </li>
        ))}
      </ul>
      {canWrite && (
        <div className="p-2 border-t border-[var(--border)] space-y-1">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Add a comment…"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1.5 text-xs"
          />
          <button
            type="button"
            onClick={() => void submit()}
            className="text-[11px] font-medium text-[var(--accent)]"
          >
            Comment
          </button>
        </div>
      )}
    </div>
  );
}
