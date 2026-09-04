"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { X } from "lucide-react";
import { OpenTab, SHELF_PAGE_MIME, SHELF_TAB_MIME } from "./types";
import { withShortcut } from "@/lib/hotkeys";

type DropSide = "before" | "after";

interface ReaderTabStripProps {
  paneId: string;
  tabs: OpenTab[];
  activeTabKey: string | null;
  focused: boolean;
  onActivate: (tabKey: string) => void;
  onClose: (tabKey: string) => void;
  onFocusPane: () => void;
  onDropPage: (tab: OpenTab) => void;
  /** Reorder tabs within this pane (drag a tab onto another). */
  onReorderTabs?: (
    fromKey: string,
    toKey: string,
    place: DropSide
  ) => void;
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
  onReorderTabs,
  variant = "bar",
}: ReaderTabStripProps) {
  const toolbar = variant === "toolbar";
  const dragKeyRef = useRef<string | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    key: string;
    place: DropSide;
  } | null>(null);
  const suppressClickRef = useRef(false);

  const clearDrag = () => {
    dragKeyRef.current = null;
    setDraggingKey(null);
    setDropTarget(null);
  };

  const isTabDrag = (types: DataTransfer["types"]) => {
    for (let i = 0; i < types.length; i += 1) {
      if (types[i] === SHELF_TAB_MIME) return true;
    }
    return false;
  };

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
      onDragEnd={clearDrag}
      data-pane-id={paneId}
      data-focused={focused ? "true" : undefined}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeTabKey;
        const dragging = draggingKey === tab.key;
        const dropBefore =
          dropTarget?.key === tab.key && dropTarget.place === "before";
        const dropAfter =
          dropTarget?.key === tab.key && dropTarget.place === "after";
        return (
          <div
            key={tab.key}
            draggable={Boolean(onReorderTabs) && tabs.length > 1}
            onDragStart={(e) => {
              if (!onReorderTabs || tabs.length < 2) {
                e.preventDefault();
                return;
              }
              dragKeyRef.current = tab.key;
              setDraggingKey(tab.key);
              suppressClickRef.current = false;
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData(
                SHELF_TAB_MIME,
                JSON.stringify({ paneId, tabKey: tab.key })
              );
              // Some browsers require a text/plain payload for the drag to start.
              e.dataTransfer.setData("text/plain", tab.title);
            }}
            onDragEnd={() => {
              if (dragKeyRef.current) {
                suppressClickRef.current = true;
              }
              clearDrag();
            }}
            onDragOver={(e) => {
              if (!onReorderTabs || !isTabDrag(e.dataTransfer.types)) return;
              const from = dragKeyRef.current;
              if (!from || from === tab.key) {
                setDropTarget(null);
                return;
              }
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              const rect = e.currentTarget.getBoundingClientRect();
              const place: DropSide =
                e.clientX < rect.left + rect.width / 2 ? "before" : "after";
              setDropTarget((prev) =>
                prev?.key === tab.key && prev.place === place
                  ? prev
                  : { key: tab.key, place }
              );
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDropTarget((prev) =>
                  prev?.key === tab.key ? null : prev
                );
              }
            }}
            onDrop={(e) => {
              if (!onReorderTabs || !isTabDrag(e.dataTransfer.types)) return;
              e.preventDefault();
              e.stopPropagation();
              const from = dragKeyRef.current;
              const place = dropTarget?.key === tab.key ? dropTarget.place : null;
              clearDrag();
              if (!from || from === tab.key || !place) return;
              onReorderTabs(from, tab.key, place);
            }}
            className={clsx(
              "group relative flex items-center gap-1 max-w-[180px] min-w-0 shrink-0 rounded-md px-2 py-1.5 text-xs border border-transparent",
              onReorderTabs && tabs.length > 1
                ? "cursor-grab active:cursor-grabbing"
                : "cursor-pointer",
              dragging && "opacity-40",
              active
                ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]/60 hover:text-[var(--text-secondary)]",
              dropBefore &&
                "before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:rounded-full before:bg-[var(--accent)]",
              dropAfter &&
                "after:absolute after:right-0 after:top-1 after:bottom-1 after:w-0.5 after:rounded-full after:bg-[var(--accent)]"
            )}
            onClick={() => {
              if (suppressClickRef.current) {
                suppressClickRef.current = false;
                return;
              }
              onActivate(tab.key);
            }}
            title={
              onReorderTabs && tabs.length > 1
                ? `${tab.title} — drag to reorder`
                : tab.title
            }
          >
            <span className="truncate flex-1 pointer-events-none">{tab.title}</span>
            <button
              type="button"
              className="p-0.5 rounded opacity-60 hover:opacity-100 hover:bg-[var(--bg-primary)] text-[var(--text-muted)]"
              title={withShortcut("Close tab", "w")}
              aria-label={`Close ${tab.title}`}
              draggable={false}
              onMouseDown={(e) => e.stopPropagation()}
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
