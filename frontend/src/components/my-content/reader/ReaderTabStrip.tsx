"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { X } from "lucide-react";
import { OpenTab, SHELF_PAGE_MIME } from "./types";
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
  /** Reorder on drop: move `fromKey` before/after `toKey`. */
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
  const canReorder = Boolean(onReorderTabs) && tabs.length > 1;
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

  const placeForEvent = (
    e: React.DragEvent<HTMLElement>
  ): DropSide => {
    const rect = e.currentTarget.getBoundingClientRect();
    return e.clientX < rect.left + rect.width / 2 ? "before" : "after";
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
        // Library page drops onto the strip.
        const types = e.dataTransfer.types;
        let isPage = false;
        for (let i = 0; i < types.length; i += 1) {
          if (types[i] === SHELF_PAGE_MIME) {
            isPage = true;
            break;
          }
        }
        if (isPage) {
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
            draggable={canReorder}
            onDragStart={(e) => {
              if (!canReorder) {
                e.preventDefault();
                return;
              }
              // Close button must not start a drag.
              if ((e.target as Element).closest("button")) {
                e.preventDefault();
                return;
              }
              dragKeyRef.current = tab.key;
              setDraggingKey(tab.key);
              suppressClickRef.current = false;
              e.dataTransfer.effectAllowed = "move";
              // text/plain is required for drag to start in some browsers;
              // custom MIME types are often hidden during dragover, so we
              // rely on dragKeyRef for reorder hit-testing instead.
              e.dataTransfer.setData("text/plain", tab.title);
            }}
            onDragEnd={() => {
              if (dragKeyRef.current) suppressClickRef.current = true;
              clearDrag();
            }}
            onDragOver={(e) => {
              // Use the in-strip drag ref — custom MIME is not visible in
              // dragover.types in Chrome/Safari, which broke the first pass.
              const from = dragKeyRef.current;
              if (!onReorderTabs || !from) return;
              if (from === tab.key) {
                setDropTarget(null);
                return;
              }
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = "move";
              const place = placeForEvent(e);
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
              const from = dragKeyRef.current;
              if (!onReorderTabs || !from) return;
              // Prefer tab reorder over opening a library page on this chip.
              e.preventDefault();
              e.stopPropagation();
              const place =
                dropTarget?.key === tab.key
                  ? dropTarget.place
                  : placeForEvent(e);
              clearDrag();
              if (from === tab.key) return;
              onReorderTabs(from, tab.key, place);
              suppressClickRef.current = true;
            }}
            className={clsx(
              "group relative flex items-center gap-1 max-w-[180px] min-w-0 shrink-0 rounded-md px-2 py-1.5 text-xs border border-transparent",
              canReorder
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
              canReorder ? `${tab.title} — drag to reorder` : tab.title
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
