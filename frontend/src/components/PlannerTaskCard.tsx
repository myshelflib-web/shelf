"use client";

import {
  CalendarDays,
  ExternalLink,
  Repeat,
  Trash2,
} from "lucide-react";
import type { StudyTask } from "@/types";
import { canDragItem, formatPlanTime } from "@/lib/plannerBoard";
import type { PlannerCardMotion } from "@/components/usePlannerCardMotion";

export function PlannerTaskCard({
  task,
  compact = false,
  dragging = false,
  motion = null,
  notebook,
  now,
  onDragStart,
  onDragEnd,
  onEdit,
  onToggleDone,
  onRemove,
}: {
  task: StudyTask;
  compact?: boolean;
  dragging?: boolean;
  motion?: PlannerCardMotion;
  notebook: string | null;
  now: Date;
  onDragStart: (task: StudyTask, e: React.DragEvent) => void;
  onDragEnd: () => void;
  onEdit: (task: StudyTask) => void;
  onToggleDone: (task: StudyTask) => void;
  onRemove: (id: string) => void;
}) {
  const isEvent = task.kind === "EVENT";
  const repeating = Boolean(isEvent && task.recurrence && task.recurrence !== "NONE");
  const ext = isEvent && task.href && /^https?:\/\//i.test(task.href) ? task.href : null;
  const draggable = canDragItem(task);
  const dragClass = dragging ? "opacity-40" : "";
  const motionClass =
    motion === "exit"
      ? "planner-card-exit"
      : motion === "enter"
        ? "planner-card-enter"
        : "";

  if (compact) {
    return (
      <button
        type="button"
        draggable={draggable}
        onDragStart={(e) => {
          e.stopPropagation();
          onDragStart(task, e);
        }}
        onDragEnd={onDragEnd}
        onClick={(e) => {
          e.stopPropagation();
          onEdit(task);
        }}
        className={`block w-full truncate rounded px-1 py-0.5 text-left text-[9px] font-medium border-l-2 ${
          isEvent
            ? "border-l-[var(--text-muted)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
            : "border-l-[var(--accent)] bg-[var(--accent-light)] text-[var(--text-primary)]"
        } ${task.completed ? "line-through opacity-60" : ""} ${
          draggable ? "cursor-grab active:cursor-grabbing" : ""
        } ${dragClass} ${motionClass}`}
      >
        {task.title}
      </button>
    );
  }

  return (
    <div
      draggable={draggable}
      onClick={(e) => e.stopPropagation()}
      onDragStart={(e) => onDragStart(task, e)}
      onDragEnd={onDragEnd}
      className={`group rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1.5 border-l-2 ${
        isEvent ? "border-l-[var(--text-muted)]" : "border-l-[var(--accent)]"
      } ${task.completed ? "opacity-60" : ""} ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      } ${dragClass} ${motionClass}`}
    >
      <div className="flex items-start gap-1.5 min-w-0">
        {isEvent ? (
          <CalendarDays className="w-3 h-3 mt-0.5 shrink-0 text-[var(--text-muted)]" />
        ) : (
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggleDone(task)}
            className="mt-0.5"
            aria-label="Mark task done"
          />
        )}
        <button
          type="button"
          onClick={() => onEdit(task)}
          className={`flex-1 min-w-0 text-left text-[11px] font-semibold leading-snug hover:text-[var(--accent)] ${
            task.completed ? "line-through" : ""
          }`}
        >
          {task.title}
        </button>
        {repeating && <Repeat className="w-2.5 h-2.5 mt-0.5 shrink-0 text-[var(--accent)]" />}
        {ext && (
          <a
            href={ext}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 text-[var(--accent)]"
            aria-label="Open event link"
          >
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
        <button
          type="button"
          onClick={() => onRemove(task.id)}
          className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)]"
          aria-label="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <p className="mt-1 text-[10px] text-[var(--text-muted)]">
        {formatPlanTime(task, now)}
        {notebook ? ` · ${notebook}` : ""}
      </p>
      <span
        className={`mt-1 inline-flex text-[9px] font-semibold rounded-full px-1.5 py-0.5 ${
          isEvent
            ? "bg-[var(--bg-primary)] text-[var(--text-muted)]"
            : "bg-[var(--accent-subtle)] text-[var(--accent)]"
        }`}
      >
        {isEvent ? "Event" : "Task"}
      </span>
    </div>
  );
}
