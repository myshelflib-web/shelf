"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { emitContentChanged } from "@/lib/contentEvents";
import { UserSubject } from "@/types";

interface NotebookEditModalProps {
  notebook: UserSubject;
  onClose: () => void;
  onSaved?: (notebook: UserSubject) => void;
}

export function NotebookEditModal({
  notebook,
  onClose,
  onSaved,
}: NotebookEditModalProps) {
  const [name, setName] = useState(notebook.name);
  const [description, setDescription] = useState(notebook.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(notebook.name);
    setDescription(notebook.description ?? "");
  }, [notebook]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = name.trim();
    if (!next) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { subject } = await api.myContent.updateSubject(notebook.id, {
        name: next,
        description: description.trim() || null,
      });
      onSaved?.({ ...notebook, ...subject });
      emitContentChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label="Edit collection"
        className="relative w-full max-w-md rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Edit collection
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={save} className="px-5 py-4 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs text-[var(--text-muted)]">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              autoFocus
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs text-[var(--text-muted)]">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="Optional notes about this collection"
            />
          </label>
          {error && (
            <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="chip-btn px-3 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-4 py-2 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
