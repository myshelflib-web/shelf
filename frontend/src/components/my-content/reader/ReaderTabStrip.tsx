"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { X } from "lucide-react";
import { OpenTab, SHELF_PAGE_MIME } from "./types";
import { withShortcut } from "@/lib/hotkeys";
import { tabIndexFromPointerX } from "./reorderOpenTabs";

interface ReaderTabStripProps {
  paneId: string;
  tabs: OpenTab[];
  activeTabKey: string | null;
  focused: boolean;
  onActivate: (tabKey: string) => void;
  onClose: (tabKey: string) => void;
  onFocusPane: () => void;
  onDropPage: (tab: OpenTab) => void;
  /** Cursor-style reorder: move `fromKey` to `toIndex`. */
  onReorderTabs?: (fromKey: string, toIndex: number) => void;
  /** `toolbar` sits between chrome buttons; `bar` is a full-width row. */
  variant?: "bar" | "toolbar";
}

const DRAG_THRESHOLD_PX = 6;

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
  const tabElsRef = useRef(new Map<string, HTMLElement>());
  const dragRef = useRef<{
    key: string;
    pointerId: number;
    startX: number;
    startY: number;
    active: boolean;
    lastIndex: number;
  } | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const suppressClickRef = useRef(false);
  const onReorderRef = useRef(onReorderTabs);
  onReorderRef.current = onReorderTabs;
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;
      if (!drag.active) {
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
        drag.active = true;
        suppressClickRef.current = true;
        setDraggingKey(drag.key);
      }
      e.preventDefault();

      const rects = tabsRef.current.map((t) => {
        const el = tabElsRef.current.get(t.key);
        const r = el?.getBoundingClientRect();
        return {
          key: t.key,
          left: r?.left ?? 0,
          width: r?.width ?? 0,
        };
      });
      const toIndex = tabIndexFromPointerX(e.clientX, rects, drag.key);
      if (toIndex === drag.lastIndex) return;
      drag.lastIndex = toIndex;
      onReorderRef.current?.(drag.key, toIndex);
    };

    const onUp = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.pointerId) return;
      dragRef.current = null;
      setDraggingKey(null);
      // Keep suppressClick through the click that follows pointerup.
      if (drag.active) {
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      }
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <div
      className={clsx(
        "flex items-stretch gap-0.5 overflow-x-auto overscroll-x-contain min-w-0",
        toolbar
          ? "flex-1 px-2"
          : "shrink-0 border-b border-[var(--border)] bg-[var(--bg-secondary)] px-1 min-h-[36px]",
        draggingKey && "select-none"
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
        const dragging = draggingKey === tab.key;
        return (
          <div
            key={tab.key}
            ref={(el) => {
              if (el) tabElsRef.current.set(tab.key, el);
              else tabElsRef.current.delete(tab.key);
            }}
            className={clsx(
              "group relative flex items-center gap-1 max-w-[180px] min-w-0 shrink-0 rounded-md px-2 py-1.5 text-xs border border-transparent",
              canReorder ? "cursor-grab touch-none" : "cursor-pointer",
              dragging && "opacity-50 cursor-grabbing z-10",
              active
                ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]/60 hover:text-[var(--text-secondary)]"
            )}
            onPointerDown={(e) => {
              if (!canReorder || e.button !== 0) return;
              if ((e.target as Element).closest("button")) return;
              const from = tabs.findIndex((t) => t.key === tab.key);
              dragRef.current = {
                key: tab.key,
                pointerId: e.pointerId,
                startX: e.clientX,
                startY: e.clientY,
                active: false,
                lastIndex: from,
              };
            }}
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
              onPointerDown={(e) => e.stopPropagation()}
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
