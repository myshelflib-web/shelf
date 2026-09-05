"use client";

import { Calendar } from "lucide-react";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Format datetime-local value (`YYYY-MM-DDTHH:mm`) as `DD-MM-YYYY · HH:mm`. */
export function formatShelfDateTime(value: string): string {
  if (!value) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return value;
  return `${m[3]}-${m[2]}-${m[1]} · ${m[4]}:${m[5]}`;
}

/** Format date value (`YYYY-MM-DD`) as `DD-MM-YYYY`. */
export function formatShelfDate(value: string): string {
  if (!value) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return value;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

const fieldShell =
  "relative mt-0.5 flex h-[38px] w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-sm";

export function ShelfDateTimeField({
  value,
  onChange,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  "aria-label"?: string;
}) {
  const empty = !value;
  return (
    <div className={fieldShell}>
      <span
        className={`min-w-0 flex-1 truncate tabular-nums ${
          empty ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"
        }`}
      >
        {empty ? "DD-MM-YYYY · HH:mm" : formatShelfDateTime(value)}
      </span>
      <Calendar className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden />
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}

export function ShelfDateField({
  value,
  onChange,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  "aria-label"?: string;
}) {
  const empty = !value;
  return (
    <div className={fieldShell}>
      <span
        className={`min-w-0 flex-1 truncate tabular-nums ${
          empty ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"
        }`}
      >
        {empty ? "DD-MM-YYYY" : formatShelfDate(value)}
      </span>
      <Calendar className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" aria-hidden />
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}

/** Build datetime-local string for local calendar day at 09:00. */
export function localDateTimeAtNine(day: Date): string {
  return `${day.getFullYear()}-${pad2(day.getMonth() + 1)}-${pad2(day.getDate())}T09:00`;
}
