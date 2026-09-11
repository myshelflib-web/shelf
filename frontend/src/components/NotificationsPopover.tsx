"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { listTasks, peekLocalTasks } from "@/lib/offline/tasks";
import { upcomingOpenTasks } from "@/lib/upcomingTasks";
import { StudyTask } from "@/types";
import { PhoneBottomSheet } from "@/components/PhoneBottomSheet";
import { useIsPhone } from "@/hooks/useIsPhone";

function formatWhen(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const isPhone = useIsPhone();

  useEffect(() => {
    let cancelled = false;
    const apply = (all: StudyTask[]) => {
      if (!cancelled) setTasks(upcomingOpenTasks(all));
    };
    const refresh = (showSpinner: boolean) => {
      if (showSpinner) setLoading(true);
      let settled = false;
      void peekLocalTasks()
        .then((all) => {
          if (!settled && !cancelled) apply(all);
        })
        .catch(() => {});
      listTasks()
        .then((all) => {
          settled = true;
          apply(all);
        })
        .catch(() => {
          settled = true;
          if (!cancelled) setTasks([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
    refresh(true);
    const onChange = () => refresh(false);
    window.addEventListener("shelf:tasks-changed", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("shelf:tasks-changed", onChange);
    };
  }, []);

  useEffect(() => {
    if (!open || isPhone) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, isPhone]);

  const overdue = tasks.filter((t) => {
    if (!t.dueAt) return false;
    return new Date(t.dueAt).getTime() < Date.now();
  }).length;
  const badge = overdue || tasks.length;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        aria-label="Notifications"
        aria-expanded={open}
        title="Tasks due soon"
        data-tour-id="hdr-notifications"
      >
        <Bell className="w-4 h-4" />
        {badge > 0 && (
          <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[var(--accent)] text-white text-[9px] font-medium flex items-center justify-center leading-none">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </button>

      {isPhone ? (
        <PhoneBottomSheet
          open={open}
          onClose={() => setOpen(false)}
          title="Notifications"
        >
          <p className="text-[11px] text-[var(--text-muted)] mb-2 -mt-1">
            Open tasks due in the next 7 days
          </p>
          <div className="max-h-[50dvh] overflow-y-auto -mx-1">
            {loading && tasks.length === 0 ? (
              <p className="flex items-center justify-center gap-2 py-8 text-[13px] text-[var(--text-muted)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading…
              </p>
            ) : tasks.length === 0 ? (
              <p className="px-1 py-8 text-center text-[13px] text-[var(--text-muted)]">
                No upcoming tasks. Add one from the planner.
              </p>
            ) : (
              <ul>
                {tasks.map((task) => {
                  const late = task.dueAt
                    ? new Date(task.dueAt).getTime() < Date.now()
                    : false;
                  const dateKey = task.dueAt ? task.dueAt.slice(0, 10) : "";
                  return (
                    <li key={task.id}>
                      <Link
                        href={
                          dateKey
                            ? `/planner?date=${dateKey}&edit=${task.id}`
                            : `/planner?edit=${task.id}`
                        }
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-2 px-2 py-2.5 rounded-lg hover:bg-[var(--bg-secondary)]"
                      >
                        <CheckCircle2
                          className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                            late ? "text-red-400" : "text-[var(--text-muted)]"
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] truncate text-[var(--text-primary)]">
                            {task.title}
                          </span>
                          <span
                            className={`text-[11px] ${
                              late ? "text-red-400" : "text-[var(--text-muted)]"
                            }`}
                          >
                            {late ? "Overdue · " : "Due · "}
                            {task.dueAt ? formatWhen(task.dueAt) : "Unscheduled"}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <Link
            href="/planner"
            onClick={() => setOpen(false)}
            className="mt-3 inline-flex items-center gap-1.5 h-11 text-[13px] font-medium text-[var(--accent)]"
          >
            <CalendarDays className="w-4 h-4" />
            View all tasks
          </Link>
        </PhoneBottomSheet>
      ) : (
        open && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[60] w-[18rem] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-[var(--border)]">
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-[11px] text-[var(--text-muted)]">
              Open tasks due in the next 7 days
            </p>
          </div>
          <div className="max-h-[16rem] overflow-y-auto py-1">
            {loading && tasks.length === 0 ? (
              <p className="flex items-center justify-center gap-2 py-8 text-[13px] text-[var(--text-muted)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading…
              </p>
            ) : tasks.length === 0 ? (
              <p className="px-3.5 py-8 text-center text-[13px] text-[var(--text-muted)]">
                No upcoming tasks. Add one from the planner.
              </p>
            ) : (
              <ul>
                {tasks.map((task) => {
                  const late = task.dueAt
                    ? new Date(task.dueAt).getTime() < Date.now()
                    : false;
                  const dateKey = task.dueAt ? task.dueAt.slice(0, 10) : "";
                  return (
                    <li key={task.id}>
                      <Link
                        href={
                          dateKey
                            ? `/planner?date=${dateKey}&edit=${task.id}`
                            : `/planner?edit=${task.id}`
                        }
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-2 px-3.5 py-2 hover:bg-[var(--bg-secondary)]"
                      >
                        <CheckCircle2
                          className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                            late ? "text-red-400" : "text-[var(--text-muted)]"
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] truncate text-[var(--text-primary)]">
                            {task.title}
                          </span>
                          <span
                            className={`text-[11px] ${
                              late
                                ? "text-red-400"
                                : "text-[var(--text-muted)]"
                            }`}
                          >
                            {late ? "Overdue · " : "Due · "}
                            {task.dueAt ? formatWhen(task.dueAt) : "Unscheduled"}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="px-3.5 py-2 border-t border-[var(--border)]">
            <Link
              href="/planner"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              View all tasks
            </Link>
          </div>
        </div>
        )
      )}
    </div>
  );
}
