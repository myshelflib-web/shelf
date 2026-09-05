"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { localYmd, monthCells } from "@/lib/monthGrid";
import { positionMenuBelow } from "@/lib/ui/positionMenuBelow";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Format date value (`YYYY-MM-DD`) as `DD-MM-YYYY`. */
export function formatShelfDate(value: string): string {
  if (!value) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return value;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function dateParts(value: string): { dd: string; mm: string; yyyy: string } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return { yyyy: m[1], mm: m[2], dd: m[3] };
}

/** Date part of a datetime-local value. */
export function datePartFromDateTime(value: string): string {
  if (!value) return "";
  return value.slice(0, 10);
}

/** Keep existing clock time when the calendar day changes; default 09:00. */
export function withPreservedTime(date: string, previous: string): string {
  if (!date) return "";
  const time = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(previous)?.[2] ?? "09:00";
  return `${date}T${time}`;
}

/** Build datetime-local string for local calendar day at 09:00. */
export function localDateTimeAtNine(day: Date): string {
  return `${day.getFullYear()}-${pad2(day.getMonth() + 1)}-${pad2(day.getDate())}T09:00`;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function parseYmd(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function ShelfDatePicker({
  value,
  onChange,
  "aria-label": ariaLabel,
  allowClear = true,
}: {
  value: string;
  onChange: (v: string) => void;
  "aria-label"?: string;
  allowClear?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuReady, setMenuReady] = useState(false);
  const [cursor, setCursor] = useState(() => parseYmd(value) ?? new Date());
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setCursor(parseYmd(value) ?? new Date());
  }, [open, value]);

  const close = useCallback(() => {
    setOpen(false);
    setMenuReady(false);
  }, []);

  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;
    positionMenuBelow(menu, trigger, { width: 280, gap: 6 });
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
  }, [open, reposition, cursor, value]);

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

  const empty = !value;
  const today = localYmd(new Date());
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = monthCells(year, month);
  const monthLabel = cursor.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const pick = (ymd: string) => {
    onChange(ymd);
    close();
  };

  const menu =
    open && mounted ? (
      <div
        ref={menuRef}
        id={listId}
        role="dialog"
        aria-label={ariaLabel ? `${ariaLabel} calendar` : "Choose date"}
        className={`shelf-date-menu${menuReady ? " is-ready" : ""}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <button
            type="button"
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Previous month"
            onClick={() => setCursor(new Date(year, month - 1, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-[13px] font-semibold tracking-tight text-[var(--text-primary)]">
            {monthLabel}
          </p>
          <button
            type="button"
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Next month"
            onClick={() => setCursor(new Date(year, month + 1, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((d, i) => (
            <span
              key={`${d}-${i}`}
              className="py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]"
            >
              {d}
            </span>
          ))}
          {cells.map((day, i) => {
            if (!day) return <span key={`e-${i}`} />;
            const key = localYmd(new Date(year, month, day));
            const selected = key === value;
            const isToday = key === today;
            return (
              <button
                key={key}
                type="button"
                onClick={() => pick(key)}
                className={`flex aspect-square items-center justify-center rounded-[8px] text-[12px] tabular-nums transition-colors ${
                  selected
                    ? "bg-[var(--accent)] font-semibold text-white shadow-sm"
                    : isToday
                      ? "bg-[var(--accent-subtle)] font-semibold text-[var(--accent)] ring-1 ring-[var(--accent)]/50"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-2.5">
          {allowClear ? (
            <button
              type="button"
              className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              onClick={() => {
                onChange("");
                close();
              }}
            >
              Clear
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-[var(--accent)] hover:bg-[var(--accent-subtle)]"
            onClick={() => pick(today)}
          >
            Today
          </button>
        </div>
      </div>
    ) : null;

  const parts = dateParts(value);
  const accessibleLabel = empty
    ? ariaLabel ?? "Choose date"
    : `${ariaLabel ?? "Date"} ${formatShelfDate(value)}`;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={accessibleLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((v) => !v)}
        className={`shelf-date-trigger${open ? " is-open" : ""}`}
      >
        <span className={`shelf-date-value${empty ? " is-placeholder" : ""}`}>
          {parts ? (
            <>
              <span className="shelf-date-part">{parts.dd}</span>
              <span className="shelf-date-sep">·</span>
              <span className="shelf-date-part">{parts.mm}</span>
              <span className="shelf-date-sep">·</span>
              <span className="shelf-date-part">{parts.yyyy}</span>
            </>
          ) : (
            <>
              <span>DD</span>
              <span className="shelf-date-sep">·</span>
              <span>MM</span>
              <span className="shelf-date-sep">·</span>
              <span>YYYY</span>
            </>
          )}
        </span>
        <span className="shelf-date-icon" aria-hidden>
          <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>
      </button>
      {menu ? createPortal(menu, document.body) : null}
    </>
  );
}

/** Date-only field (`YYYY-MM-DD`) with Shelf calendar popover. */
export function ShelfDateField({
  value,
  onChange,
  "aria-label": ariaLabel,
  allowClear = true,
}: {
  value: string;
  onChange: (v: string) => void;
  "aria-label"?: string;
  allowClear?: boolean;
}) {
  return (
    <ShelfDatePicker
      value={value}
      onChange={onChange}
      aria-label={ariaLabel}
      allowClear={allowClear}
    />
  );
}

/**
 * Date-only UI over a datetime-local value (`YYYY-MM-DDTHH:mm`).
 * Picking a day keeps the existing time (or 09:00).
 */
export function ShelfDateTimeField({
  value,
  onChange,
  "aria-label": ariaLabel,
  allowClear = true,
}: {
  value: string;
  onChange: (v: string) => void;
  "aria-label"?: string;
  allowClear?: boolean;
}) {
  return (
    <ShelfDatePicker
      value={datePartFromDateTime(value)}
      onChange={(date) => onChange(withPreservedTime(date, value))}
      aria-label={ariaLabel}
      allowClear={allowClear}
    />
  );
}
