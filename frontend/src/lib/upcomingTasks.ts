import type { StudyTask } from "@/types";

const WEEK_MS = 7 * 86400000;

/** Open tasks due in the next 7 days (including overdue), newest-due last. */
export function upcomingOpenTasks(
  tasks: StudyTask[],
  now = Date.now()
): StudyTask[] {
  const week = now + WEEK_MS;
  return tasks
    .filter((t) => {
      if (t.kind === "EVENT") return false;
      if (t.completed) return false;
      if (!t.dueAt) return false;
      const due = new Date(t.dueAt).getTime();
      if (!Number.isFinite(due)) return false;
      return due <= week;
    })
    .sort(
      (a, b) =>
        new Date(a.dueAt ?? 0).getTime() - new Date(b.dueAt ?? 0).getTime()
    )
    .slice(0, 12);
}
