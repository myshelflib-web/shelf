"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Slash } from "lucide-react";
import {
  STUDY_AI_COMMANDS,
  filterCommands,
  type StudyAiCommand,
} from "@/lib/studyAiCommands";

export function StudyAiCommandsModal({
  open,
  initialQuery = "/",
  onPick,
  onClose,
}: {
  open: boolean;
  initialQuery?: string;
  onPick: (cmd: StudyAiCommand) => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!open) return;
    const next = initialQuery.startsWith("/")
      ? initialQuery
      : `/${initialQuery}`;
    setQuery(next || "/");
    setActive(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open, initialQuery]);

  const hits = useMemo(() => filterCommands(query), [query]);
  const selected = hits[Math.min(active, Math.max(0, hits.length - 1))];

  useEffect(() => {
    setActive((i) => (i >= hits.length ? 0 : i));
  }, [hits.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[14vh] px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="Close commands"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Study AI commands"
        className="relative w-full max-w-xl overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl"
      >
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-[var(--border)]">
          <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              const v = e.target.value;
              setQuery(v.startsWith("/") || v === "" ? v : `/${v}`);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(hits.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                if (selected) onPick(selected);
              }
            }}
            placeholder="Search commands…"
            className="no-focus-ring flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
          />
          <span className="text-[10px] font-semibold text-[var(--accent)]">
            /
          </span>
        </div>
        <ul className="min-h-[12rem] max-h-[22rem] overflow-y-auto py-1.5">
          {hits.length === 0 ? (
            <li className="px-4 py-8 text-center text-[12px] text-[var(--text-muted)]">
              No matching command
            </li>
          ) : (
            hits.map((cmd, i) => (
              <li key={cmd.slash}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => onPick(cmd)}
                  className={`w-full flex items-start gap-3 px-3.5 py-2 text-left ${
                    i === active
                      ? "bg-[var(--accent-subtle)]"
                      : "hover:bg-[var(--bg-secondary)]"
                  }`}
                >
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--accent)]">
                    <Slash className="w-3 h-3" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="text-[13px] font-semibold text-[var(--text-primary)]">
                        /{cmd.slash}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {cmd.name}
                      </span>
                    </span>
                    <span className="block text-[12px] text-[var(--text-secondary)] leading-snug mt-0.5">
                      {cmd.description}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
        <p className="px-3.5 py-2 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)]">
          {STUDY_AI_COMMANDS.length} commands
          <span className="mx-1.5 opacity-35">·</span>
          ↑↓ to move
          <span className="mx-1.5 opacity-35">·</span>
          Enter to run
          <span className="mx-1.5 opacity-35">·</span>
          Esc to close
        </p>
      </div>
    </div>
  );
}
