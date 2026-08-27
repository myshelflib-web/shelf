"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Trash2, X } from "lucide-react";
import clsx from "clsx";

export type ConfirmDialogOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

export type AlertDialogOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
};

export type PromptDialogOptions = {
  title: string;
  message?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  placeholder?: string;
};

export type AppDialogRequest =
  | ({ mode: "confirm" } & ConfirmDialogOptions)
  | ({ mode: "alert" } & AlertDialogOptions)
  | ({ mode: "prompt" } & PromptDialogOptions);

export function AppDialog({
  request,
  onConfirm,
  onCancel,
}: {
  request: AppDialogRequest;
  onConfirm: (value?: string) => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const messageId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(
    request.mode === "prompt" ? (request.defaultValue ?? "") : ""
  );

  useEffect(() => {
    setValue(request.mode === "prompt" ? (request.defaultValue ?? "") : "");
  }, [request]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      onCancel();
    };
    document.addEventListener("keydown", onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [onCancel]);

  useEffect(() => {
    if (request.mode !== "prompt") return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [request]);

  const confirmLabel =
    request.mode === "alert"
      ? (request.confirmLabel ?? "OK")
      : request.mode === "prompt"
        ? (request.confirmLabel ?? "Save")
        : (request.confirmLabel ?? (request.danger ? "Delete" : "OK"));
  const cancelLabel =
    request.mode === "alert" ? "" : (request.cancelLabel ?? "Cancel");
  const danger = request.mode === "confirm" && Boolean(request.danger);
  const message = request.message;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (request.mode === "prompt") {
      const next = value.trim();
      if (!next) return;
      onConfirm(next);
      return;
    }
    onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={message ? messageId : undefined}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close"
        onClick={onCancel}
      />
      <form
        onSubmit={submit}
        className="relative w-full max-w-md rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b border-[var(--border)]">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-base font-semibold text-[var(--text-primary)]"
            >
              {request.title}
            </h2>
            {message ? (
              <p
                id={messageId}
                className="text-sm text-[var(--text-muted)] mt-1 whitespace-pre-line"
              >
                {message}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
            aria-label="Close"
            onClick={onCancel}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {request.mode === "prompt" ? (
          <div className="px-4 pt-4">
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={request.placeholder}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
        ) : null}
        <div className="flex items-center justify-end gap-2 p-4">
          {request.mode !== "alert" ? (
            <button
              type="button"
              className="px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
          ) : null}
          <button
            type="submit"
            className={clsx(
              "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold",
              danger ? "bg-red-600 text-white hover:bg-red-500" : "btn-primary"
            )}
            autoFocus={request.mode !== "prompt"}
          >
            {danger ? <Trash2 className="w-4 h-4" /> : null}
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
