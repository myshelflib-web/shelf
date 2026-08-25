import { Prisma, StudyItemKind } from "@prisma/client";
import { expandInRange } from "./recurrence.js";

/** Prisma `where` fragment for a visible planner range plus backlog extras. */
export function rangedTaskWhere(from: Date, to: Date): Prisma.StudyTaskWhereInput {
  return {
    OR: [
      { dueAt: null },
      { dueAt: { gte: from, lt: to } },
      {
        kind: StudyItemKind.TASK,
        completed: false,
        dueAt: { lt: from },
      },
      {
        kind: StudyItemKind.EVENT,
        recurrence: { not: "NONE" },
        dueAt: { lt: to },
        OR: [{ recurUntil: null }, { recurUntil: { gte: from } }],
      },
    ],
  };
}

type RangedTask = {
  id: string;
  dueAt: Date | null;
  endsAt: Date | null;
  kind: string;
  completed: boolean;
  recurrence?: string | null;
  recurUntil?: Date | null;
};

/** Keep unscheduled + overdue incomplete tasks, then expand the rest in range. */
export function mergeRangedTasks<T extends RangedTask>(
  tasks: T[],
  from: Date,
  to: Date
) {
  const unscheduled = tasks.filter((t) => t.dueAt == null);
  const overdue = tasks.filter(
    (t) =>
      t.dueAt != null &&
      t.kind === "TASK" &&
      !t.completed &&
      t.dueAt < from
  );
  const dated = tasks.filter((t): t is T & { dueAt: Date } => t.dueAt != null);
  const expanded = expandInRange(dated, from, to);
  return [...unscheduled, ...overdue, ...expanded];
}
