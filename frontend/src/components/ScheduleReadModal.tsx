"use client";

import { useEffect, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { createTask } from "@/lib/offline/tasks";

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toDateInputValue(d);
}

export function ScheduleReadModal({
  pageTitle,
  pageHref,
  onClose,
  onScheduled,
}: {
  pageTitle: string;
  pageHref: string;
  onClose: () => void;
  onScheduled?: () => void;
}) {
  const [date, setDate] = useState(tomorrow);
  const [time, setTime] = useState("09:00");
  const [title, setTitle] = useState(`Continue reading: ${pageTitle}`);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(`Continue reading: ${pageTitle}`);
  }, [pageTitle]);

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = title.trim();
    if (!trimmed || !date) return;
    setSaving(true);
    try {
      const dueAt = new Date(`${date}T${time || "09:00"}:00`);
      if (Number.isNaN(dueAt.getTime())) {
        setError("Pick a valid date and time.");
        return;
      }
      await createTask({
        title: trimmed,
        dueAt: dueAt.toISOString(),
        kind: "TASK",
        href: pageHref,
      });
      window.dispatchEvent(new Event("shelf:tasks-changed"));
      onScheduled?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not schedule");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label="Schedule reading"
        className="relative w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--text-primary)] inline-flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[var(--accent)]" />
            Schedule reading
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[12px] text-[var(--text-muted)] mb-4">
          Add a calendar task linked to this page so you can pick it up later.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <label className="block text-[11px] text-[var(--text-muted)]">
            Task title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="mt-0.5 w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-[11px] text-[var(--text-muted)]">
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="mt-0.5 w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
              />
            </label>
            <label className="block text-[11px] text-[var(--text-muted)]">
              Time
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-0.5 w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
              />
            </label>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-3 py-1.5 text-sm rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {saving ? "Scheduling…" : "Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
