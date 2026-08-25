import { StudyTask } from "@/types";

export const NEXT_UP_LIMIT = 2;

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

export function isOpenActionable(task: StudyTask): boolean {
  return task.kind !== "EVENT" && !task.completed;
}

/** Overdue incomplete → today → tomorrow → later. Max `limit` items. */
export function pickNextUpTasks(
  tasks: StudyTask[],
  now = new Date(),
  limit = NEXT_UP_LIMIT
): { items: StudyTask[]; remaining: number; total: number } {
  const today = startOfLocalDay(now);
  const tomorrow = addDays(today, 1);
  const later = addDays(today, 2);

  const open = tasks
    .filter(isOpenActionable)
    .filter((task) => Boolean(task.dueAt))
    .map((task) => ({ task, due: new Date(task.dueAt as string) }))
    .filter((row) => Number.isFinite(row.due.getTime()))
    .sort((a, b) => a.due.getTime() - b.due.getTime());

  const buckets = {
    overdue: open.filter((row) => row.due < today),
    today: open.filter((row) => row.due >= today && row.due < tomorrow),
    tomorrow: open.filter((row) => row.due >= tomorrow && row.due < later),
    later: open.filter((row) => row.due >= later),
  };

  const ranked = [
    ...buckets.overdue,
    ...buckets.today,
    ...buckets.tomorrow,
    ...buckets.later,
  ].map((row) => row.task);

  return {
    items: ranked.slice(0, limit),
    remaining: Math.max(0, ranked.length - limit),
    total: ranked.length,
  };
}

export function nextUpBucket(
  dueAt: string,
  now = new Date()
): "overdue" | "today" | "tomorrow" | "later" {
  const due = new Date(dueAt);
  const today = startOfLocalDay(now);
  if (due < today) return "overdue";
  if (due < addDays(today, 1)) return "today";
  if (due < addDays(today, 2)) return "tomorrow";
  return "later";
}

export function formatNextUpWhen(dueAt: string, now = new Date()): string {
  const due = new Date(dueAt);
  const time = due.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const bucket = nextUpBucket(dueAt, now);
  if (bucket === "overdue") {
    const date = due.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    return `Overdue · ${date}`;
  }
  if (bucket === "today") return `Today · ${time}`;
  if (bucket === "tomorrow") return `Tomorrow · ${time}`;
  const date = due.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${date} · ${time}`;
}

export function calendarDateKey(dueAt: string): string {
  const d = new Date(dueAt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
