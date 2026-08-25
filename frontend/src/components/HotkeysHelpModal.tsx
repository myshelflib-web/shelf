"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { formatChord, HOTKEY_HELP, isApplePlatform } from "@/lib/hotkeys";

export function HotkeysHelpModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const apple = isApplePlatform();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[10vh] px-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="Close keyboard shortcuts"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className="relative w-full max-w-2xl max-h-[min(36rem,78vh)] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border)] shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Keyboard shortcuts
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Shortcuts pause while you type or draw.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-3 grid sm:grid-cols-2 gap-x-6 gap-y-4">
          {HOTKEY_HELP.map((group) => (
            <section key={group.title}>
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
                {group.title}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center justify-between gap-3 py-0.5"
                  >
                    <span className="text-[13px] text-[var(--text-secondary)]">
                      {item.label}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          className="min-w-[1.25rem] px-1.5 py-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-secondary)] text-[10px] font-medium text-[var(--text-muted)] font-sans"
                        >
                          {formatChord(k, apple)}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)] shrink-0">
          Press <kbd className="font-sans">?</kbd> or{" "}
          <kbd className="font-sans">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}
