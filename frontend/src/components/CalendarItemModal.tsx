"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { StudyItemKind } from "@/types";

export type Recurrence = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

export function CalendarItemModal({
  kind,
  editing,
  title,
  dueAt,
  endsAt,
  href,
  pageHref,
  notebookSlug,
  recurrence,
  recurUntil,
  notebooks,
  pages,
  onKindChange,
  onTitleChange,
  onDueAtChange,
  onEndsAtChange,
  onHrefChange,
  onPageHrefChange,
  onNotebookSlugChange,
  onRecurrenceChange,
  onRecurUntilChange,
  onSubmit,
  onClose,
}: {
  kind: StudyItemKind;
  editing: boolean;
  title: string;
  dueAt: string;
  endsAt: string;
  href: string;
  pageHref: string;
  notebookSlug: string;
  recurrence: Recurrence;
  recurUntil: string;
  notebooks: { slug: string; name: string }[];
  pages: { href: string; label: string; notebookSlug: string }[];
  onKindChange?: (v: StudyItemKind) => void;
  onTitleChange: (v: string) => void;
  onDueAtChange: (v: string) => void;
  onEndsAtChange: (v: string) => void;
  onHrefChange: (v: string) => void;
  onPageHrefChange: (v: string) => void;
  onNotebookSlugChange: (v: string) => void;
  onRecurrenceChange: (v: Recurrence) => void;
  onRecurUntilChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  const isEvent = kind === "EVENT";
  const heading = `${editing ? "Edit" : "New"} ${isEvent ? "event" : "task"}`;
  const filteredPages = notebookSlug
    ? pages.filter((p) => p.notebookSlug === notebookSlug)
    : pages;

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
        aria-label={heading}
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--text-primary)]">{heading}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {!editing && onKindChange && (
            <div className="flex gap-1 p-0.5 rounded-lg bg-[var(--bg-secondary)]">
              {(["TASK", "EVENT"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => onKindChange(k)}
                  className={`flex-1 text-[12px] py-1.5 rounded-md ${
                    kind === k
                      ? "bg-[var(--bg-elevated)] text-[var(--accent)] font-semibold shadow-sm"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {k === "TASK" ? "Task" : "Event"}
                </button>
              ))}
            </div>
          )}
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={isEvent ? "Event title" : "Task title"}
            required
            autoFocus
            className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="text-[11px] text-[var(--text-muted)]">
              Start
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => onDueAtChange(e.target.value)}
                className="mt-0.5 w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
              />
              <span className="block mt-0.5 text-[10px] text-[var(--text-muted)]">
                Leave empty to keep in To plan.
              </span>
            </label>
            <label className="text-[11px] text-[var(--text-muted)]">
              End
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => onEndsAtChange(e.target.value)}
                className="mt-0.5 w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
              />
            </label>
          </div>

          {isEvent ? (
            <>
              <input
                type="text"
                inputMode="url"
                value={href}
                onChange={(e) => onHrefChange(e.target.value)}
                placeholder="External link (optional) — https://…"
                className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
              />
              <label className="text-[11px] text-[var(--text-muted)] block">
                Repeat
                <select
                  value={recurrence}
                  onChange={(e) =>
                    onRecurrenceChange(e.target.value as Recurrence)
                  }
                  className="ui-select mt-0.5 w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
                >
                  <option value="NONE">Does not repeat</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </label>
              {recurrence !== "NONE" && (
                <label className="text-[11px] text-[var(--text-muted)] block">
                  Until (optional)
                  <input
                    type="date"
                    value={recurUntil}
                    onChange={(e) => onRecurUntilChange(e.target.value)}
                    className="mt-0.5 w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
                  />
                </label>
              )}
            </>
          ) : (
            <>
              <select
                value={notebookSlug}
                onChange={(e) => onNotebookSlugChange(e.target.value)}
                className="ui-select w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
              >
                <option value="">All collections</option>
                {notebooks.map((n) => (
                  <option key={n.slug} value={n.slug}>
                    {n.name}
                  </option>
                ))}
              </select>
              <select
                value={pageHref}
                onChange={(e) => onPageHrefChange(e.target.value)}
                className="ui-select w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
              >
                <option value="">Link collection, topic, or page (optional)</option>
                {filteredPages.map((p) => (
                  <option key={p.href} value={p.href}>
                    {p.label}
                  </option>
                ))}
              </select>
            </>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="text-sm px-3 py-2 rounded-lg bg-[var(--accent)] text-white"
            >
              {editing ? "Save" : "Add"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-3 py-2 rounded-lg border border-[var(--border)]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
