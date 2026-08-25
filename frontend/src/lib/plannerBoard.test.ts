import { describe, expect, it } from "vitest";
import type { StudyTask } from "@/types";
import {
  backlogItems,
  canDragItem,
  itemsForDay,
  moveDueToDay,
  moveEndsWithDue,
} from "./plannerBoard";

const now = new Date("2026-08-23T15:00:00");

function task(over: Partial<StudyTask>): StudyTask {
  return {
    id: "t1",
    title: "Item",
    dueAt: "2026-08-24T09:00:00",
    completed: false,
    kind: "TASK",
    ...over,
  };
}

describe("backlogItems", () => {
  it("includes unscheduled and overdue incomplete tasks, not events on a day", () => {
    const items = backlogItems(
      [
        task({ id: "open", dueAt: null }),
        task({ id: "late", dueAt: "2026-08-20T09:00:00" }),
        task({ id: "done", dueAt: "2026-08-20T09:00:00", completed: true }),
        task({
          id: "event",
          kind: "EVENT",
          dueAt: "2026-08-20T10:00:00",
        }),
        task({ id: "today", dueAt: "2026-08-23T18:00:00" }),
      ],
      now
    );
    expect(items.map((t) => t.id).sort()).toEqual(["late", "open"]);
  });
});

describe("itemsForDay", () => {
  it("hides overdue incomplete tasks from past day columns", () => {
    const monday = new Date("2026-08-17T12:00:00");
    const onMonday = itemsForDay(
      [
        task({ id: "late", dueAt: "2026-08-17T09:00:00" }),
        task({
          id: "event",
          kind: "EVENT",
          dueAt: "2026-08-17T10:00:00",
        }),
      ],
      monday,
      now
    );
    expect(onMonday.map((t) => t.id)).toEqual(["event"]);
  });
});

describe("moveDueToDay", () => {
  it("keeps clock time when moving a dated item", () => {
    const wed = new Date("2026-08-26T00:00:00");
    const next = new Date(moveDueToDay("2026-08-24T19:30:00", wed));
    expect(next.getDate()).toBe(26);
    expect(next.getHours()).toBe(19);
    expect(next.getMinutes()).toBe(30);
  });

  it("uses start of day when unscheduling then dropping", () => {
    const wed = new Date("2026-08-26T12:00:00");
    const next = new Date(moveDueToDay(null, wed));
    expect(next.getDate()).toBe(26);
    expect(next.getHours()).toBe(0);
    expect(next.getMinutes()).toBe(0);
  });
});

describe("moveEndsWithDue", () => {
  it("shifts the end by the same duration", () => {
    const nextDue = moveDueToDay(
      "2026-08-24T10:00:00",
      new Date("2026-08-26T00:00:00")
    );
    const nextEnd = moveEndsWithDue(
      "2026-08-24T10:00:00",
      "2026-08-24T12:00:00",
      nextDue
    );
    expect(nextEnd).toBeTruthy();
    const end = new Date(nextEnd!);
    expect(end.getDate()).toBe(26);
    expect(end.getHours()).toBe(12);
  });
});

describe("canDragItem", () => {
  it("blocks recurring occurrences", () => {
    expect(
      canDragItem(
        task({
          id: "e1::2026-08-24",
          kind: "EVENT",
          recurrence: "WEEKLY",
        })
      )
    ).toBe(false);
    expect(canDragItem(task({ id: "plain" }))).toBe(true);
    expect(
      canDragItem(
        task({
          id: "series",
          kind: "EVENT",
          recurrence: "WEEKLY",
        })
      )
    ).toBe(false);
  });
});
