import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearDashboardHomeSession,
  rememberDashboardHome,
  seedDashboardHome,
  seedReadingStats,
} from "./dashboardHomeSeed";
import type { StudyTask, UserSubject } from "@/types";

describe("dashboardHomeSeed", () => {
  beforeEach(() => {
    clearDashboardHomeSession();
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      length: 0,
      key: () => null,
    });
  });

  it("seeds reading stats without waiting on network", () => {
    expect(seedReadingStats()).toEqual({
      streak: 0,
      todaySeconds: 0,
      activeDates: [],
    });
  });

  it("reuses the session snapshot on remount", () => {
    const tasks = [{ id: "t1", title: "Physics", dueAt: "2026-09-11" }] as StudyTask[];
    const listed = [{ id: "n1", slug: "polity", name: "Polity" }] as UserSubject[];
    rememberDashboardHome({
      listed,
      rootPages: [],
      notebookTotal: 1,
      recentNotebooks: listed,
      lastRead: {
        href: "/my-content/polity/file/x",
        title: "My file",
        notebookSlug: "polity",
      },
      tasks,
    });

    const seeded = seedDashboardHome();
    expect(seeded.notebookTotal).toBe(1);
    expect(seeded.tasks).toEqual(tasks);
    expect(seeded.recentNotebooks[0]?.slug).toBe("polity");
    expect(seeded.lastRead?.title).toBe("My file");
  });
});
