import { describe, expect, it } from "vitest";
import { StudyItemKind } from "@prisma/client";
import { mergeRangedTasks, rangedTaskWhere } from "./plannerTasks.js";

const from = new Date("2026-08-23T00:00:00.000Z");
const to = new Date("2026-08-30T00:00:00.000Z");

describe("rangedTaskWhere", () => {
  it("includes unscheduled items and overdue incomplete tasks", () => {
    const where = rangedTaskWhere(from, to);
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { dueAt: null },
        { dueAt: { gte: from, lt: to } },
        {
          kind: StudyItemKind.TASK,
          completed: false,
          dueAt: { lt: from },
        },
      ])
    );
  });
});

describe("mergeRangedTasks", () => {
  it("keeps unscheduled items beside in-range work", () => {
    const tasks = [
      {
        id: "open",
        kind: "TASK",
        dueAt: null,
        completed: false,
        endsAt: null,
      },
      {
        id: "tue",
        kind: "TASK",
        dueAt: new Date("2026-08-25T09:00:00.000Z"),
        completed: false,
        endsAt: null,
      },
    ];
    const merged = mergeRangedTasks(tasks, from, to);
    expect(merged.map((t) => t.id).sort()).toEqual(["open", "tue"]);
  });

  it("keeps overdue incomplete tasks from before the window", () => {
    const tasks = [
      {
        id: "late",
        kind: "TASK",
        dueAt: new Date("2026-08-20T09:00:00.000Z"),
        completed: false,
        endsAt: null,
      },
      {
        id: "done",
        kind: "TASK",
        dueAt: new Date("2026-08-20T09:00:00.000Z"),
        completed: true,
        endsAt: null,
      },
    ];
    const merged = mergeRangedTasks(tasks, from, to);
    expect(merged.map((t) => t.id)).toEqual(["late"]);
  });

  it("does not treat overdue events as backlog extras", () => {
    const tasks = [
      {
        id: "past-event",
        kind: "EVENT",
        dueAt: new Date("2026-08-20T09:00:00.000Z"),
        completed: false,
        endsAt: null,
        recurrence: "NONE",
      },
    ];
    expect(mergeRangedTasks(tasks, from, to)).toEqual([]);
  });
});
