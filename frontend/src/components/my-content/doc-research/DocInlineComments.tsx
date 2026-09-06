"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { api } from "@/lib/api";
import type { PageComment } from "@/lib/researchDocTypes";
import { useAppDialog } from "@/hooks/useAppDialog";

type Props = {
  pageId: string;
  bodyRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  onDocEdited: () => void;
  pendingQuote?: string;
};

function unwrapMark(el: Element) {
  const parent = el.parentNode;
  while (el.firstChild) parent?.insertBefore(el.firstChild, el);
  el.remove();
}

function wrapSelectionWithMark(commentId: string): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
  const range = sel.getRangeAt(0);
  const span = document.createElement("span");
  span.className = "shelf-comment-mark";
  span.setAttribute("data-comment-id", commentId);
  try {
    range.surroundContents(span);
  } catch {
    const frag = range.extractContents();
    span.appendChild(frag);
    range.insertNode(span);
  }
  return true;
}

function ensureMarkForQuote(body: HTMLElement, comment: PageComment) {
  if (body.querySelector(`[data-comment-id="${CSS.escape(comment.id)}"]`)) {
    return;
  }
  const quote = (comment.anchorQuote || "").trim();
  if (quote.length < 2) return;
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const text = node.textContent || "";
    const idx = text.indexOf(quote);
    if (idx < 0) continue;
    const range = document.createRange();
    range.setStart(node, idx);
    range.setEnd(node, idx + quote.length);
    const span = document.createElement("span");
    span.className = "shelf-comment-mark";
    span.setAttribute("data-comment-id", comment.id);
    try {
      range.surroundContents(span);
    } catch {
      /* skip */
    }
    return;
  }
}

/** Inline-style comments: highlighted anchors in the Doc + linked gutter cards. */
export function DocInlineComments({
  pageId,
  bodyRef,
  open,
  onClose,
  onDocEdited,
  pendingQuote,
}: Props) {
  const { alert } = useAppDialog();
  const [comments, setComments] = useState<PageComment[]>([]);
  const [canWrite, setCanWrite] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const reload = useCallback(async () => {
    const r = await api.myContent.listComments(pageId);
    const openComments = r.comments.filter((c) => !c.resolvedAt);
    setComments(openComments);
    setCanWrite(r.canWrite);
    const body = bodyRef.current;
    if (body) {
      for (const c of openComments) ensureMarkForQuote(body, c);
    }
  }, [bodyRef, pageId]);

  useEffect(() => {
    if (!open) return;
    void reload().catch(() => null);
  }, [open, reload]);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body || !open) return;
    const onClick = (e: MouseEvent) => {
      const mark = (e.target as HTMLElement | null)?.closest?.(
        ".shelf-comment-mark"
      ) as HTMLElement | null;
      if (!mark) return;
      const id = mark.getAttribute("data-comment-id");
      if (id) setActiveId(id);
    };
    body.addEventListener("click", onClick);
    return () => body.removeEventListener("click", onClick);
  }, [bodyRef, open]);

  async function submitNew() {
    if (!canWrite || !draft.trim()) return;
    const quote = pendingQuote?.trim();
    const tempId = `tmp-${Math.random().toString(36).slice(2, 9)}`;
    wrapSelectionWithMark(tempId);
    try {
      const { comment } = await api.myContent.createComment(pageId, {
        body: draft.trim(),
        anchorQuote: quote,
      });
      const mark = bodyRef.current?.querySelector(
        `[data-comment-id="${tempId}"]`
      );
      if (mark) mark.setAttribute("data-comment-id", comment.id);
      setDraft("");
      onDocEdited();
      await reload();
      setActiveId(comment.id);
    } catch (e) {
      const bad = bodyRef.current?.querySelector(`[data-comment-id="${tempId}"]`);
      if (bad) unwrapMark(bad);
      await alert({
        title: "Comment failed",
        message: e instanceof Error ? e.message : "Could not save comment",
      });
    }
  }

  async function resolve(id: string) {
    await api.myContent.updateComment(pageId, id, { resolved: true });
    const mark = bodyRef.current?.querySelector(
      `[data-comment-id="${CSS.escape(id)}"]`
    );
    if (mark) unwrapMark(mark);
    onDocEdited();
    await reload();
  }

  if (!open) return null;

  return (
    <aside
      className="absolute right-0 top-0 bottom-0 z-20 w-[300px] border-l border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_8px_30px_rgba(0,0,0,0.18)] flex flex-col"
      aria-label="Comments"
    >
      <div className="flex items-center justify-between gap-2 px-3.5 py-3 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="w-4 h-4 text-[var(--accent)] shrink-0" />
          <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">
            Comments
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {canWrite && (
        <div className="p-3 border-b border-[var(--border)] space-y-2 shrink-0">
          {pendingQuote ? (
            <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 italic border-l-2 border-[var(--accent)]/50 pl-2">
              “{pendingQuote}”
            </p>
          ) : (
            <p className="text-[11px] text-[var(--text-muted)]">
              Select text in the Doc to anchor a comment.
            </p>
          )}
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="Add a comment…"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
          <button
            type="button"
            onClick={() => void submitNew()}
            className="btn-primary px-3 py-1.5 rounded-lg text-[11px] font-semibold"
          >
            Comment
          </button>
        </div>
      )}

      <ul className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {comments.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => {
                setActiveId(c.id);
                bodyRef.current
                  ?.querySelector(`[data-comment-id="${CSS.escape(c.id)}"]`)
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className={`w-full text-left rounded-xl border p-2.5 transition-colors ${
                activeId === c.id
                  ? "border-[var(--accent)] bg-[var(--accent-light)]"
                  : "border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)]/40"
              }`}
            >
              <p className="text-[10px] text-[var(--text-muted)] mb-1">
                {c.user?.name || "You"} ·{" "}
                {new Date(c.createdAt).toLocaleString()}
              </p>
              {c.anchorQuote && (
                <p className="text-[10px] text-[var(--text-secondary)] italic line-clamp-2 mb-1.5 border-l-2 border-[var(--accent)]/40 pl-1.5">
                  {c.anchorQuote}
                </p>
              )}
              <p className="text-[12px] text-[var(--text-primary)] leading-snug">
                {c.body}
              </p>
              {canWrite && (
                <span
                  role="button"
                  tabIndex={0}
                  className="inline-block mt-1.5 text-[10px] font-medium text-[var(--accent)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    void resolve(c.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      void resolve(c.id);
                    }
                  }}
                >
                  Resolve
                </span>
              )}
            </button>
          </li>
        ))}
        {comments.length === 0 && (
          <li className="px-1 py-3 text-[12px] text-[var(--text-muted)]">
            No open comments yet.
          </li>
        )}
      </ul>
    </aside>
  );
}
