"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import { OpenTab, SHELF_PAGE_MIME } from "./types";
import { withShortcut } from "@/lib/hotkeys";

interface ReaderTabStripProps {
  paneId: string;
  tabs: OpenTab[];
  activeTabKey: string | null;
  focused: boolean;
  onActivate: (tabKey: string) => void;
  onClose: (tabKey: string) => void;
  onFocusPane: () => void;
  onDropPage: (tab: OpenTab) => void;
  /** `toolbar` sits between chrome buttons; `bar` is a full-width row. */
  variant?: "bar" | "toolbar";
}

export function ReaderTabStrip({
  paneId,
  tabs,
  activeTabKey,
  focused,
  onActivate,
  onClose,
  onFocusPane,
  onDropPage,
  variant = "bar",
}: ReaderTabStripProps) {
  const toolbar = variant === "toolbar";

  return (
    <div
      className={clsx(
        "flex items-stretch gap-0.5 overflow-x-auto overscroll-x-contain min-w-0",
        toolbar
          ? "flex-1 px-2"
          : "shrink-0 border-b border-[var(--border)] bg-[var(--bg-secondary)] px-1 min-h-[36px]"
      )}
      onMouseDown={onFocusPane}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(SHELF_PAGE_MIME)) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }
      }}
      onDrop={(e) => {
        const raw = e.dataTransfer.getData(SHELF_PAGE_MIME);
        if (!raw) return;
        e.preventDefault();
        try {
          const payload = JSON.parse(raw) as {
            href: string;
            title: string;
            pageId: string;
            scope: OpenTab["scope"];
          };
          onDropPage({
            key: payload.href,
            href: payload.href,
            title: payload.title,
            scope: payload.scope,
            pageId: payload.pageId,
          });
        } catch {
          /* ignore */
        }
      }}
      data-pane-id={paneId}
      data-focused={focused ? "true" : undefined}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeTabKey;
        return (
          <div
            key={tab.key}
            className={clsx(
              "group flex items-center gap-1 max-w-[180px] min-w-0 shrink-0 rounded-md px-2 py-1.5 text-xs cursor-pointer border border-transparent",
              active
                ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]/60 hover:text-[var(--text-secondary)]"
            )}
            onClick={() => onActivate(tab.key)}
            title={tab.title}
          >
            <span className="truncate flex-1">{tab.title}</span>
            <button
              type="button"
              className="p-0.5 rounded opacity-60 hover:opacity-100 hover:bg-[var(--bg-primary)] text-[var(--text-muted)]"
              title={withShortcut("Close tab", "w")}
              aria-label={`Close ${tab.title}`}
              onClick={(e) => {
                e.stopPropagation();
                onClose(tab.key);
              }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
