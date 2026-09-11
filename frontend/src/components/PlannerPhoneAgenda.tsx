"use client";

import type { StudyItemKind, StudyTask } from "@/types";
import {
  backlogItems,
  dayKey,
  itemsForDay,
  addDays,
  startOfLocalDay,
} from "@/lib/plannerBoard";
import { PhoneBottomSheet } from "@/components/PhoneBottomSheet";
import { useMemo, useState } from "react";

type Props = {
  cursor: Date;
  setCursor: (d: Date) => void;
  tasks: StudyTask[];
  now: Date;
  renderCard: (task: StudyTask, compact?: boolean) => React.ReactNode;
  openForm: (kind: StudyItemKind, day?: Date | null) => void;
  onMoveTask: (taskId: string, day: Date | "backlog") => void;
};

function dateStrip(center: Date): Date[] {
  const start = addDays(startOfLocalDay(center), -3);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Phone agenda: date strip + day list + backlog; tap to move (no HTML5 DnD). */
export function PlannerPhoneAgenda({
  cursor,
  setCursor,
  tasks,
  now,
  renderCard,
  openForm,
  onMoveTask,
}: Props) {
  const [moveTask, setMoveTask] = useState<StudyTask | null>(null);
  const strip = useMemo(() => dateStrip(cursor), [cursor]);
  const dayItems = itemsForDay(tasks, cursor);
  const inbox = backlogItems(tasks, now);
  const todayKey = dayKey(now);
  const cursorKey = dayKey(cursor);

  const moveTargets = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => addDays(startOfLocalDay(now), i));
    return days;
  }, [now]);

  return (
    <div
      className="planner-phone-agenda flex-1 min-h-0 flex flex-col gap-3 overflow-hidden"
      data-tour-id="planner-phone-agenda"
    >
      <div className="shrink-0 flex gap-1.5 overflow-x-auto pb-0.5 -mx-0.5 px-0.5">
        {strip.map((d) => {
          const key = dayKey(d);
          const active = key === cursorKey;
          const isToday = key === todayKey;
          const count = itemsForDay(tasks, d).length;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setCursor(startOfLocalDay(d))}
              className={`shrink-0 w-12 rounded-[10px] border px-1 py-2 text-center ${
                active
                  ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
                  : "border-[var(--border)] bg-[var(--bg-secondary)]"
              }`}
            >
              <p className="text-[10px] text-[var(--text-muted)]">
                {d.toLocaleDateString(undefined, { weekday: "short" })}
              </p>
              <p
                className={`text-[15px] font-semibold leading-tight ${
                  isToday ? "text-[var(--accent)]" : "text-[var(--text-primary)]"
                }`}
              >
                {d.getDate()}
              </p>
              {count > 0 ? (
                <p className="text-[9px] text-[var(--text-muted)] mt-0.5">{count}</p>
              ) : (
                <p className="text-[9px] opacity-0 mt-0.5">0</p>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] p-2.5">
        <div className="flex items-center justify-between gap-2 mb-2 px-0.5">
          <p className="text-[13px] font-semibold">
            {cursor.toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>
          <button
            type="button"
            onClick={() => openForm("TASK", cursor)}
            className="h-9 px-3 rounded-lg border border-dashed border-[var(--border)] text-[12px] font-semibold text-[var(--accent)]"
          >
            + Task
          </button>
        </div>
        {dayItems.length === 0 ? (
          <p className="text-[12px] text-[var(--text-muted)] px-0.5 py-6 text-center">
            Nothing scheduled. Add a task or move one from To plan.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {dayItems.map((task) => (
              <li key={task.id} className="relative">
                {renderCard(task)}
                <button
                  type="button"
                  className="mt-1 w-full h-9 rounded-lg border border-[var(--border)] text-[11px] font-medium text-[var(--text-secondary)]"
                  onClick={() => setMoveTask(task)}
                >
                  Move…
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 max-h-[38%] min-h-[5rem] overflow-y-auto rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] p-2.5">
        <div className="flex items-center justify-between px-0.5 mb-2">
          <p className="text-[12px] font-semibold">To plan</p>
          <span className="text-[10px] text-[var(--text-muted)]">{inbox.length}</span>
        </div>
        {inbox.length === 0 ? (
          <p className="text-[11px] text-[var(--text-muted)] px-0.5">Backlog is empty.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {inbox.map((task) => (
              <li key={task.id}>
                {renderCard(task)}
                <button
                  type="button"
                  className="mt-1 w-full h-9 rounded-lg border border-[var(--border)] text-[11px] font-medium text-[var(--text-secondary)]"
                  onClick={() => setMoveTask(task)}
                >
                  Schedule…
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <PhoneBottomSheet
        open={Boolean(moveTask)}
        onClose={() => setMoveTask(null)}
        title={moveTask ? `Move “${moveTask.title}”` : "Move"}
      >
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            className="h-11 rounded-[10px] border border-[var(--border)] px-3 text-left text-sm font-medium"
            onClick={() => {
              if (!moveTask) return;
              onMoveTask(moveTask.id, "backlog");
              setMoveTask(null);
            }}
          >
            To plan (unscheduled)
          </button>
          {moveTargets.map((d) => (
            <button
              key={dayKey(d)}
              type="button"
              className="h-11 rounded-[10px] border border-[var(--border)] px-3 text-left text-sm"
              onClick={() => {
                if (!moveTask) return;
                onMoveTask(moveTask.id, d);
                setMoveTask(null);
                setCursor(startOfLocalDay(d));
              }}
            >
              {d.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
              {dayKey(d) === todayKey ? " · Today" : ""}
            </button>
          ))}
        </div>
      </PhoneBottomSheet>
    </div>
  );
}
