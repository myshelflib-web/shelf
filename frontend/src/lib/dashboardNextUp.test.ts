import { describe, expect, it } from "vitest";
import { StudyTask } from "@/types";
import {
  formatNextUpWhen,
  pickNextUpTasks,
} from "./dashboardNextUp";

function task(
  id: string,
  dueAt: string,
  extra: Partial<StudyTask> = {}
): StudyTask {
  return {
    id,
    title: id,
    dueAt,
    completed: false,
    kind: "TASK",
    ...extra,
  };
}

const now = new Date("2026-08-22T15:00:00");

describe("pickNextUpTasks", () => {
  it("never includes events or completed work", () => {
    const picked = pickNextUpTasks(
      [
        task("done", "2026-08-22T10:00:00", { completed: true }),
        task("event", "2026-08-22T11:00:00", { kind: "EVENT" }),
        task("open", "2026-08-22T19:00:00"),
      ],
      now
    );
    expect(picked.items.map((t) => t.id)).toEqual(["open"]);
    expect(picked.total).toBe(1);
  });

  it("shows two tasks today when those are the soonest", () => {
    const picked = pickNextUpTasks(
      [
        task("a", "2026-08-22T19:00:00"),
        task("b", "2026-08-22T20:00:00"),
      ],
      now
    );
    expect(picked.items.map((t) => t.id)).toEqual(["a", "b"]);
    expect(picked.remaining).toBe(0);
  });

  it("fills a second slot with tomorrow when today has one item", () => {
    const picked = pickNextUpTasks(
      [
        task("today", "2026-08-22T19:00:00"),
        task("tomorrow", "2026-08-23T10:00:00"),
      ],
      now
    );
    expect(picked.items.map((t) => t.id)).toEqual(["today", "tomorrow"]);
  });

  it("skips an empty today and surfaces tomorrow", () => {
    const picked = pickNextUpTasks(
      [
        task("t1", "2026-08-23T10:00:00"),
        task("t2", "2026-08-23T11:00:00"),
      ],
      now
    );
    expect(picked.items.map((t) => t.id)).toEqual(["t1", "t2"]);
  });

  it("keeps only the first two and reports overflow", () => {
    const picked = pickNextUpTasks(
      [
        task("a", "2026-08-22T19:00:00"),
        task("b", "2026-08-22T20:00:00"),
        task("c", "2026-08-23T10:00:00"),
      ],
      now
    );
    expect(picked.items.map((t) => t.id)).toEqual(["a", "b"]);
    expect(picked.remaining).toBe(1);
    expect(picked.total).toBe(3);
  });

  it("promotes overdue work ahead of future items", () => {
    const picked = pickNextUpTasks(
      [
        task("later", "2026-08-24T10:00:00"),
        task("today", "2026-08-22T19:00:00"),
        task("overdue", "2026-08-20T09:00:00"),
      ],
      now
    );
    expect(picked.items.map((t) => t.id)).toEqual(["overdue", "today"]);
  });

  it("returns an empty list when nothing is upcoming", () => {
    expect(pickNextUpTasks([], now).items).toEqual([]);
    expect(
      pickNextUpTasks(
        [task("done", "2026-08-22T10:00:00", { completed: true })],
        now
      ).total
    ).toBe(0);
  });

  it("skips unscheduled tasks", () => {
    const picked = pickNextUpTasks(
      [
        task("later", "2026-08-24T10:00:00"),
        { ...task("inbox", "2026-08-24T10:00:00"), dueAt: null },
      ],
      now
    );
    expect(picked.items.map((t) => t.id)).toEqual(["later"]);
  });
});

describe("formatNextUpWhen", () => {
  it("labels overdue, today, tomorrow, and later", () => {
    expect(formatNextUpWhen("2026-08-20T09:00:00", now)).toMatch(/^Overdue · /);
    expect(formatNextUpWhen("2026-08-22T19:00:00", now)).toMatch(/^Today · /);
    expect(formatNextUpWhen("2026-08-23T10:00:00", now)).toMatch(/^Tomorrow · /);
    expect(formatNextUpWhen("2026-08-25T10:00:00", now)).toMatch(/· /);
  });
});
