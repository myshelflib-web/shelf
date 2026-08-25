import { describe, expect, it } from "vitest";
import type { StudyTask } from "@/types";
import { upcomingOpenTasks } from "./upcomingTasks";

const task = (over: Partial<StudyTask>): StudyTask => ({
  id: "t1",
  title: "Read",
  dueAt: "2026-08-26T09:00:00.000Z",
  completed: false,
  kind: "TASK",
  ...over,
});

describe("upcomingOpenTasks", () => {
  const now = Date.parse("2026-08-25T12:00:00.000Z");

  it("keeps open tasks due within a week, including overdue", () => {
    const items = upcomingOpenTasks(
      [
        task({ id: "soon", dueAt: "2026-08-27T09:00:00.000Z" }),
        task({ id: "late", dueAt: "2026-08-20T09:00:00.000Z" }),
        task({ id: "done", completed: true }),
        task({ id: "event", kind: "EVENT" }),
        task({ id: "far", dueAt: "2026-09-20T09:00:00.000Z" }),
        task({ id: "none", dueAt: null }),
      ],
      now
    );
    expect(items.map((t) => t.id)).toEqual(["late", "soon"]);
  });
});
