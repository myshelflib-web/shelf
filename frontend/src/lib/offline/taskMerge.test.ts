import { describe, expect, it } from "vitest";
import type { StudyTask } from "@/types";
import type { LocalTask } from "./db";
import { mergeTaskLists, taskInRange } from "./taskMerge";

const baseTask = (over: Partial<StudyTask>): StudyTask => ({
  id: "task-1",
  title: "Read polity",
  dueAt: "2026-08-24T09:00:00.000Z",
  completed: false,
  kind: "TASK",
  ...over,
});

describe("taskInRange", () => {
  it("filters by from/to", () => {
    const task = baseTask({});
    expect(taskInRange(task, "2026-08-24T00:00:00.000Z", "2026-08-25T00:00:00.000Z")).toBe(true);
    expect(
      taskInRange(
        baseTask({ dueAt: "2026-08-26T09:00:00.000Z" }),
        "2026-08-24T00:00:00.000Z",
        "2026-08-25T00:00:00.000Z"
      )
    ).toBe(false);
  });

  it("keeps unscheduled items in any ranged fetch", () => {
    expect(
      taskInRange(baseTask({ dueAt: null }), "2026-08-24T00:00:00.000Z", "2026-08-25T00:00:00.000Z")
    ).toBe(true);
  });

  it("keeps overdue incomplete tasks from before from", () => {
    expect(
      taskInRange(
        baseTask({ dueAt: "2026-08-20T09:00:00.000Z" }),
        "2026-08-24T00:00:00.000Z",
        "2026-08-31T00:00:00.000Z"
      )
    ).toBe(true);
    expect(
      taskInRange(
        baseTask({ dueAt: "2026-08-20T09:00:00.000Z", completed: true }),
        "2026-08-24T00:00:00.000Z",
        "2026-08-31T00:00:00.000Z"
      )
    ).toBe(false);
  });
});

describe("mergeTaskLists", () => {
  it("keeps offline-only tasks", () => {
    const local: LocalTask[] = [
      {
        ...baseTask({ id: "local-1", title: "Offline task" }),
        syncStatus: "pending",
        localOnly: true,
        updatedAt: 1,
      },
    ];
    const merged = mergeTaskLists([], local);
    expect(merged).toHaveLength(1);
    expect(merged[0].title).toBe("Offline task");
  });

  it("prefers pending local edits over server rows", () => {
    const server = [baseTask({ title: "Server title" })];
    const local: LocalTask[] = [
      {
        ...baseTask({ title: "Local title" }),
        syncStatus: "pending",
        localOnly: false,
        updatedAt: 1,
      },
    ];
    const merged = mergeTaskLists(server, local);
    expect(merged[0].title).toBe("Local title");
  });

  it("drops pending-delete tasks", () => {
    const local: LocalTask[] = [
      {
        ...baseTask({}),
        syncStatus: "pending-delete",
        localOnly: false,
        updatedAt: 1,
      },
    ];
    expect(mergeTaskLists([baseTask({})], local)).toHaveLength(0);
  });
});
