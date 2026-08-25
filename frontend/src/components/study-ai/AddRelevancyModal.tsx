"use client";

import { useEffect, useRef, useState } from "react";
import { FileUp, X } from "lucide-react";
import { api } from "@/lib/api";
import type { StudyRelevancyDoc } from "@/types";

export function AddRelevancyModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (doc: StudyRelevancyDoc) => void;
}) {
  const [mode, setMode] = useState<"paste" | "upload">("paste");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submitPaste = async () => {
    const t = title.trim();
    const b = body.trim();
    if (!t || !b || busy) return;
    setBusy(true);
    setError("");
    try {
      const { doc } = await api.study.createRelevancyDoc({ title: t, body: b });
      onCreated(doc);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const submitUpload = async (file: File) => {
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (title.trim()) fd.append("title", title.trim());
      const { doc } = await api.study.uploadRelevancyDoc(fd);
      onCreated(doc);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add relevancy doc"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
            Add syllabus / relevancy doc
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("paste")}
              className={`text-[12px] px-3 py-1.5 rounded-full border transition-colors ${
                mode === "paste"
                  ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--text-secondary)]"
              }`}
            >
              Paste text
            </button>
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={`text-[12px] px-3 py-1.5 rounded-full border transition-colors ${
                mode === "upload"
                  ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--text-secondary)]"
              }`}
            >
              Upload file
            </button>
          </div>

          <label className="block space-y-1">
            <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
              Title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. UPSC GS1 syllabus"
              className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)]"
            />
          </label>

          {mode === "paste" ? (
            <label className="block space-y-1">
              <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                Content
              </span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                placeholder="Paste syllabus or relevancy notes…"
                className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)] resize-y min-h-[160px]"
              />
            </label>
          ) : (
            <div className="space-y-2">
              <p className="text-[12px] text-[var(--text-muted)]">
                PDF or .txt / .md. Text is extracted and saved for reuse.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void submitUpload(file);
                }}
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 text-[13px] px-3 py-2 rounded-[10px] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
              >
                <FileUp className="w-4 h-4" />
                Choose file
              </button>
            </div>
          )}

          {error && <p className="text-[12px] text-red-400">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] px-3 py-1.5 rounded-[10px] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
          >
            Cancel
          </button>
          {mode === "paste" && (
            <button
              type="button"
              disabled={busy || !title.trim() || !body.trim()}
              onClick={() => void submitPaste()}
              className="text-[13px] px-3 py-1.5 rounded-[10px] bg-[var(--accent)] text-white disabled:opacity-40 hover:bg-[var(--accent-hover)]"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
