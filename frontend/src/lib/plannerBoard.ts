import type { StudyTask } from "@/types";
import { localYmd } from "@/lib/monthGrid";

export const PLANNER_DND_MIME = "application/x-shelf-planner";

export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

export function startOfWeek(d: Date): Date {
  const day = startOfLocalDay(d);
  return addDays(day, -day.getDay());
}

export function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isOccurrenceId(id: string): boolean {
  return id.includes("::");
}

export function isBacklogItem(task: StudyTask, now = new Date()): boolean {
  if (!task.dueAt) return !task.completed;
  if (task.kind === "EVENT" || task.completed) return false;
  const due = new Date(task.dueAt);
  if (Number.isNaN(due.getTime())) return true;
  return due < startOfLocalDay(now);
}

export function backlogItems(tasks: StudyTask[], now = new Date()): StudyTask[] {
  return tasks.filter((t) => isBacklogItem(t, now));
}

export function itemsForDay(
  tasks: StudyTask[],
  day: Date,
  now = new Date()
): StudyTask[] {
  return tasks.filter((t) => {
    if (!t.dueAt || isBacklogItem(t, now)) return false;
    const due = new Date(t.dueAt);
    return !Number.isNaN(due.getTime()) && sameLocalDay(due, day);
  });
}

export function canDragItem(task: StudyTask): boolean {
  if (isOccurrenceId(task.id)) return false;
  if (task.kind === "EVENT" && task.recurrence && task.recurrence !== "NONE") {
    return false;
  }
  return true;
}

/** Move a due timestamp onto `day`, keeping the clock time when it had one. */
export function moveDueToDay(
  dueAt: string | null | undefined,
  day: Date
): string {
  const target = startOfLocalDay(day);
  if (!dueAt) return target.toISOString();
  const prev = new Date(dueAt);
  if (Number.isNaN(prev.getTime())) return target.toISOString();
  const moved = new Date(target);
  moved.setHours(
    prev.getHours(),
    prev.getMinutes(),
    prev.getSeconds(),
    prev.getMilliseconds()
  );
  return moved.toISOString();
}

export function moveEndsWithDue(
  dueAt: string | null | undefined,
  endsAt: string | null | undefined,
  nextDue: string
): string | null {
  if (!dueAt || !endsAt) return null;
  const duration = new Date(endsAt).getTime() - new Date(dueAt).getTime();
  if (!Number.isFinite(duration) || duration <= 0) return null;
  return new Date(new Date(nextDue).getTime() + duration).toISOString();
}

export function formatPlanTime(task: StudyTask, now = new Date()): string {
  if (!task.dueAt) return "No date assigned";
  const due = new Date(task.dueAt);
  if (Number.isNaN(due.getTime())) return "No date assigned";
  if (task.completed) return "Completed";
  if (isBacklogItem(task, now)) {
    return `Carried forward from ${due.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    })}`;
  }
  const midnight =
    due.getHours() === 0 && due.getMinutes() === 0 && due.getSeconds() === 0;
  if (midnight && !task.endsAt) return "Any time";
  const start = due.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  if (task.endsAt) {
    const end = new Date(task.endsAt);
    if (!Number.isNaN(end.getTime())) {
      return `${start} – ${end.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    }
  }
  return start;
}

export function formatWeekRange(from: Date): string {
  const to = addDays(from, 6);
  const sameMonth = from.getMonth() === to.getMonth();
  const start = from.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const end = to.toLocaleDateString(undefined, {
    month: sameMonth ? undefined : "short",
    day: "numeric",
  });
  return `${start} – ${end}`;
}

export function weekDays(cursor: Date): Date[] {
  const start = startOfWeek(cursor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function dayKey(day: Date): string {
  return localYmd(day);
}
