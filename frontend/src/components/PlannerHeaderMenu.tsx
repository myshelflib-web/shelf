"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { positionMenuBelow } from "@/lib/ui/positionMenuBelow";

export type PlannerHeaderActions = {
  onNewTask: () => void;
  onNewEvent: () => void;
  onToday: () => void;
  onWeek: () => void;
  onMonth: () => void;
};

export function PlannerHeaderMenu({
  onNewTask,
  onNewEvent,
  onToday,
  onWeek,
  onMonth,
}: PlannerHeaderActions) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuReady, setMenuReady] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => {
    setOpen(false);
    setMenuReady(false);
  }, []);

  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;
    positionMenuBelow(menu, trigger, { minWidth: 180, gap: 6 });
    setMenuReady(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    setMenuReady(false);
    reposition();
    const raf = window.requestAnimationFrame(reposition);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      close();
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("mousedown", onPointer, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("mousedown", onPointer, true);
    };
  }, [open, close]);

  const run = (fn: () => void) => {
    close();
    fn();
  };

  const menu =
    open && mounted ? (
      <div
        ref={menuRef}
        id={listId}
        role="menu"
        aria-label="Planner options"
        className={`shelf-select-menu${menuReady ? " is-ready" : ""}`}
        style={{ width: "11.5rem" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          role="menuitem"
          className="shelf-select-option"
          onClick={() => run(onNewTask)}
        >
          <Plus className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden />
          <span className="truncate">New task</span>
        </button>
        <button
          type="button"
          role="menuitem"
          className="shelf-select-option"
          onClick={() => run(onNewEvent)}
        >
          <CalendarPlus className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden />
          <span className="truncate">New event</span>
        </button>
        <div className="my-1 border-t border-[var(--border-subtle)]" />
        <button
          type="button"
          role="menuitem"
          className="shelf-select-option"
          onClick={() => run(onToday)}
        >
          <CalendarDays className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden />
          <span className="truncate">Go to today</span>
        </button>
        <button
          type="button"
          role="menuitem"
          className="shelf-select-option"
          onClick={() => run(onWeek)}
        >
          <CalendarRange className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden />
          <span className="truncate">Weekly view</span>
        </button>
        <button
          type="button"
          role="menuitem"
          className="shelf-select-option"
          onClick={() => run(onMonth)}
        >
          <CalendarRange className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden />
          <span className="truncate">Monthly view</span>
        </button>
      </div>
    ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Planner options"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((v) => !v)}
        className={`w-[34px] h-[34px] rounded-[9px] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] flex items-center justify-center ${
          open ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]" : ""
        }`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {menu ? createPortal(menu, document.body) : null}
    </>
  );
}
