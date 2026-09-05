"use client";

import type { StudyItemKind, StudyTask } from "@/types";
import {
  backlogItems,
  dayKey,
  itemsForDay,
  weekDays,
} from "@/lib/plannerBoard";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type PlannerDropHandlers = {
  dropTarget: string | null;
  enterDrop: (key: string, e: React.DragEvent) => void;
  allowDrop: (key: string, e: React.DragEvent) => void;
  leaveDrop: (key: string) => void;
  finishDrop: (target: Date | "backlog", e: React.DragEvent) => void;
};

type BoardShared = PlannerDropHandlers & {
  tasks: StudyTask[];
  now: Date;
  renderCard: (task: StudyTask, compact?: boolean) => React.ReactNode;
  openForm: (kind: StudyItemKind, day?: Date | null) => void;
  setFocusedDay: (day: Date | null) => void;
};

function monthCells(cursor: Date): (Date | null)[] {
  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const first = new Date(y, m, 1);
  const lastDate = new Date(y, m + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= lastDate; d++) cells.push(new Date(y, m, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function PlannerMonthBoard({
  cursor,
  tasks,
  now,
  dropTarget,
  enterDrop,
  allowDrop,
  leaveDrop,
  finishDrop,
  renderCard,
  openForm,
  setFocusedDay,
}: BoardShared & { cursor: Date }) {
  const inbox = backlogItems(tasks, now);
  const monthDays = monthCells(cursor);
  const monthWeeks = monthDays.length / 7;

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden gap-3">
      <div
        className={`shrink-0 rounded-[10px] border bg-[var(--bg-secondary)] p-2 ${
          dropTarget === "backlog"
            ? "border-[var(--accent)] bg-[var(--accent-light)]"
            : "border-[var(--border)]"
        }`}
        onDragEnter={(e) => enterDrop("backlog", e)}
        onDragOver={(e) => allowDrop("backlog", e)}
        onDragLeave={() => leaveDrop("backlog")}
        onDrop={(e) => finishDrop("backlog", e)}
      >
        <div className="flex items-center justify-between px-1 mb-1">
          <p className="text-[12px] font-semibold">To plan</p>
          <span className="text-[10px] text-[var(--text-muted)]">{inbox.length}</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {inbox.map((task) => (
            <div key={task.id} className="min-w-[12rem] max-w-[14rem]">
              {renderCard(task)}
            </div>
          ))}
          <button
            type="button"
            onClick={() => openForm("TASK")}
            className="shrink-0 h-[34px] px-3 rounded-lg border border-dashed border-[var(--border)] text-[11px] text-[var(--accent)] font-semibold"
          >
            + Add
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] p-2">
        <div className="grid grid-cols-7 gap-1 shrink-0 mb-1">
          {WEEKDAYS.map((d) => (
            <p key={d} className="text-[10px] text-[var(--text-muted)] text-center">
              {d}
            </p>
          ))}
        </div>
        <div
          className="flex-1 min-h-0 grid grid-cols-7 gap-1 overflow-hidden"
          style={{ gridTemplateRows: `repeat(${monthWeeks}, minmax(0, 1fr))` }}
        >
          {monthDays.map((day, i) => {
            if (!day) {
              return (
                <div
                  key={`empty-${i}`}
                  className="min-h-0 rounded-lg bg-[var(--bg-primary)]/40"
                />
              );
            }
            const dayTasks = itemsForDay(tasks, day, now);
            const shown = dayTasks.slice(0, 2);
            const extra = dayTasks.length - shown.length;
            const isToday = dayKey(day) === dayKey(now);
            const key = dayKey(day);
            return (
              <div
                key={key}
                onDragEnter={(e) => enterDrop(key, e)}
                onDragOver={(e) => allowDrop(key, e)}
                onDragLeave={() => leaveDrop(key)}
                onDrop={(e) => finishDrop(day, e)}
                onClick={() => setFocusedDay(day)}
                className={`min-h-0 overflow-hidden p-1 rounded-lg border flex flex-col ${
                  dropTarget === key
                    ? "border-[var(--accent)] bg-[var(--accent-light)]"
                    : isToday
                      ? "border-[var(--accent)] bg-[var(--bg-primary)]"
                      : "border-[var(--border)] bg-[var(--bg-primary)]"
                }`}
              >
                <p className="text-[10px] text-[var(--text-muted)] shrink-0 leading-none mb-1">
                  {day.getDate()}
                </p>
                <div className="min-h-0 overflow-hidden space-y-0.5">
                  {shown.map((task) => renderCard(task, true))}
                  {extra > 0 && (
                    <p className="text-[9px] text-[var(--text-muted)] px-1">
                      +{extra} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PlannerWeekBoard({
  cursor,
  tasks,
  now,
  dropTarget,
  enterDrop,
  allowDrop,
  leaveDrop,
  finishDrop,
  renderCard,
  openForm,
  setFocusedDay,
}: BoardShared & { cursor: Date }) {
  const inbox = backlogItems(tasks, now);
  const days = weekDays(cursor);

  return (
    <div className="flex-1 min-h-0 overflow-x-auto">
      <div className="h-full min-w-[1100px] grid grid-cols-[260px_minmax(0,1fr)] gap-3">
        <aside
          className={`min-h-0 flex flex-col rounded-[10px] border bg-[var(--bg-secondary)] overflow-hidden ${
            dropTarget === "backlog"
              ? "border-[var(--accent)] bg-[var(--accent-light)]"
              : "border-[var(--border)]"
          }`}
          onDragEnter={(e) => enterDrop("backlog", e)}
          onDragOver={(e) => allowDrop("backlog", e)}
          onDragLeave={() => leaveDrop("backlog")}
          onDrop={(e) => finishDrop("backlog", e)}
        >
          <div className="px-3.5 pt-3.5 pb-2.5 border-b border-[var(--border)]">
            <div className="flex items-center justify-between text-[13px] font-semibold">
              <span>To plan</span>
              <span className="text-[10px] text-[var(--text-muted)] font-medium">
                {inbox.length}
              </span>
            </div>
            <p className="text-[10.5px] text-[var(--text-muted)] mt-1">
              Capture first. Schedule when you are ready.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openForm("TASK")}
            className="mx-3 mt-2.5 mb-2 h-[34px] rounded-lg border border-dashed border-[var(--accent)]/40 bg-[var(--accent-subtle)] text-[var(--accent)] text-[11px] font-semibold"
          >
            + Add task
          </button>
          <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2 space-y-1.5">
            {inbox.length === 0 ? (
              <p className="text-[11px] text-[var(--text-muted)] px-2 py-3">
                Nothing waiting. Add a task or drag unfinished work here.
              </p>
            ) : (
              inbox.map((task) => renderCard(task))
            )}
          </div>
          <p className="px-3 py-2.5 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)]">
            Drag an item onto a day when you are ready to schedule it.
          </p>
        </aside>

        <div className="min-h-0 min-w-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-x-auto rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)]">
            <div className="grid grid-cols-7 min-w-[52rem] h-full">
              {days.map((day) => {
                const dayTasks = itemsForDay(tasks, day, now);
                const isToday = dayKey(day) === dayKey(now);
                const key = dayKey(day);
                return (
                  <div
                    key={key}
                    className={`min-h-0 h-full border-r border-[var(--border)] last:border-r-0 flex flex-col ${
                      dropTarget === key
                        ? "bg-[var(--accent-light)]"
                        : isToday
                          ? "bg-[var(--bg-primary)]"
                          : ""
                    }`}
                    onDragEnter={(e) => enterDrop(key, e)}
                    onDragOver={(e) => allowDrop(key, e)}
                    onDragLeave={() => leaveDrop(key)}
                    onDrop={(e) => finishDrop(day, e)}
                  >
                    <button
                      type="button"
                      onClick={() => setFocusedDay(day)}
                      className="h-14 px-2.5 text-left border-b border-[var(--border)]"
                    >
                      <p className="text-[9.5px] uppercase tracking-wide text-[var(--text-muted)] font-semibold">
                        {WEEKDAYS[day.getDay()]}
                      </p>
                      <p className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[16px] font-bold">{day.getDate()}</span>
                        {isToday && (
                          <span className="text-[8.5px] font-bold text-[var(--accent)] bg-[var(--accent-subtle)] rounded-full px-1.5 py-0.5">
                            Today
                          </span>
                        )}
                      </p>
                    </button>
                    <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5">
                      {dayTasks.map((task) => renderCard(task))}
                      <button
                        type="button"
                        onClick={() => openForm("TASK", day)}
                        className="w-full h-[30px] rounded-lg text-[10px] text-[var(--text-muted)] opacity-40 hover:opacity-100 hover:border hover:border-[var(--border)] hover:bg-[var(--bg-primary)]"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2.5 text-[10px] text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <i className="w-2 h-2 rounded-sm bg-[var(--accent)] not-italic" /> Task
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="w-2 h-2 rounded-sm bg-[var(--text-muted)] not-italic" />{" "}
              Event
            </span>
            <span>Completed cards fade and strike through.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
