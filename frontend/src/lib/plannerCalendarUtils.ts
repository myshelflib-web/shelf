import type { StudyTask } from "@/types";
import { addDays, startOfLocalDay, startOfWeek } from "@/lib/plannerBoard";

export type PlannerView = "week" | "month";

export function masterTaskId(id: string) {
  return id.split("::")[0];
}

export function rangeForView(
  view: PlannerView,
  cursor: Date
): { from: Date; to: Date } {
  if (view === "week") {
    const from = startOfWeek(cursor);
    return { from, to: addDays(from, 7) };
  }
  const from = startOfLocalDay(
    new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  );
  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  return { from, to: addDays(startOfLocalDay(last), 1) };
}

export function toLocalInput(d: Date) {
  const local = new Date(d);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 16);
}

export function toDateInput(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function normalizeExternalUrl(raw: string) {
  const t = raw.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export function taskHref(task: StudyTask): string | null {
  if (task.href) return task.href;
  const a = task.article;
  if (!a) return null;
  return `/learn/${a.topic.subject.slug}/${a.topic.slug}/${a.slug}`;
}
