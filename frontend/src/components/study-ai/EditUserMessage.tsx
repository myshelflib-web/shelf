"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Pencil } from "lucide-react";

const actionClass =
  "inline-flex items-center gap-1.5 h-[29px] px-2 rounded-[7px] text-[10px] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors";

/** Cursor-style: edit a sent user message, then resubmit from that turn. */
export function EditUserMessage({
  content,
  disabled,
  onResubmit,
  actions,
  children,
}: {
  content: string;
  disabled?: boolean;
  onResubmit: (next: string) => void;
  /** Extra hover actions (e.g. Delete), shown beside Edit. */
  actions?: ReactNode;
  /** Message bubble; replaced by the editor while editing. */
  children: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);

  useEffect(() => {
    if (!editing) setDraft(content);
  }, [content, editing]);

  const cancel = useCallback(() => {
    setDraft(content);
    setEditing(false);
  }, [content]);

  const submit = useCallback(() => {
    const next = draft.trim();
    if (!next || disabled) return;
    setEditing(false);
    onResubmit(next);
  }, [draft, disabled, onResubmit]);

  if (editing) {
    return (
      <div className="w-full min-w-[220px] max-w-[min(100%,420px)] space-y-1.5">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={Math.min(8, Math.max(2, draft.split("\n").length + 1))}
          autoFocus
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          className="w-full resize-y rounded-2xl rounded-br-md border border-[var(--accent)] bg-[var(--bg-elevated)] px-3.5 py-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--ring)]"
          aria-label="Edit message"
        />
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            className={actionClass}
            onClick={cancel}
            disabled={disabled}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${actionClass} text-[var(--accent)] hover:text-[var(--accent)]`}
            onClick={submit}
            disabled={disabled || !draft.trim()}
          >
            Send
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <div className="mt-1 flex flex-wrap justify-end gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          className={actionClass}
          onClick={() => {
            if (disabled) return;
            setDraft(content);
            setEditing(true);
          }}
          disabled={disabled}
          aria-label="Edit message"
        >
          <Pencil className="w-3 h-3" />
          Edit
        </button>
        {actions}
      </div>
    </>
  );
}
