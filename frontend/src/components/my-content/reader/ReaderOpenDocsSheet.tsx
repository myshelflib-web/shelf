"use client";

import { ChevronDown, X } from "lucide-react";
import { PhoneBottomSheet } from "@/components/PhoneBottomSheet";
import type { OpenTab } from "./types";

/** Phone replacement for the hidden tab strip — switch / close open docs. */
export function ReaderOpenDocsButton({
  title,
  tabCount,
  onClick,
}: {
  title: string;
  tabCount: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 min-w-0 px-2 flex items-center gap-1 text-left"
      data-tour-id="reader-open-docs"
      aria-label={
        tabCount > 1 ? `Open documents, ${tabCount} open` : "Open documents"
      }
    >
      <span className="text-xs font-medium text-[var(--text-primary)] truncate">
        {title}
      </span>
      {tabCount > 1 ? (
        <span className="shrink-0 text-[10px] font-semibold text-[var(--accent)] bg-[var(--accent-subtle)] rounded-full px-1.5 py-0.5">
          {tabCount}
        </span>
      ) : null}
      <ChevronDown className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden />
    </button>
  );
}

export function ReaderOpenDocsSheet({
  open,
  onClose,
  tabs,
  activeTabKey,
  onActivate,
  onCloseTab,
}: {
  open: boolean;
  onClose: () => void;
  tabs: OpenTab[];
  activeTabKey: string | null;
  onActivate: (key: string) => void;
  onCloseTab: (key: string) => void;
}) {
  return (
    <PhoneBottomSheet open={open} onClose={onClose} title="Open documents" tall>
      {tabs.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] py-4 text-center">
          No documents open.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {tabs.map((tab) => {
            const active = tab.key === activeTabKey;
            return (
              <li key={tab.key} className="flex items-stretch gap-1">
                <button
                  type="button"
                  className={`flex-1 min-w-0 h-12 rounded-[10px] border px-3 text-left text-sm truncate ${
                    active
                      ? "border-[var(--accent)] bg-[var(--accent-subtle)] font-semibold text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--text-primary)]"
                  }`}
                  onClick={() => {
                    onActivate(tab.key);
                    onClose();
                  }}
                >
                  {tab.title || "Untitled"}
                </button>
                <button
                  type="button"
                  className="h-12 w-12 shrink-0 rounded-[10px] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]"
                  aria-label={`Close ${tab.title || "document"}`}
                  onClick={() => onCloseTab(tab.key)}
                >
                  <X className="w-4 h-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </PhoneBottomSheet>
  );
}
