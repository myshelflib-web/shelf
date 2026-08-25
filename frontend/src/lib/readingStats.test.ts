import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  adoptUnkeyedReadingStats,
  getReadingStats,
  readingStatsKeyFor,
  tickReading,
} from "./readingStats";

describe("readingStats", () => {
  const mem = new Map<string, string>();

  beforeEach(() => {
    mem.clear();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => {
        mem.set(k, v);
      },
      removeItem: (k: string) => {
        mem.delete(k);
      },
      clear: () => mem.clear(),
    });
    vi.stubGlobal("window", {
      dispatchEvent: () => true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function setUser(id: string | null) {
    if (!id) {
      localStorage.removeItem("user");
      return;
    }
    localStorage.setItem("user", JSON.stringify({ id, email: `${id}@test.com` }));
  }

  it("keeps streak on the signed-in account only", () => {
    setUser("user-a");
    tickReading(30);
    expect(getReadingStats().streak).toBe(1);
    expect(localStorage.getItem(readingStatsKeyFor("user-a"))).toBeTruthy();

    setUser("user-b");
    expect(getReadingStats().streak).toBe(0);
    expect(getReadingStats().activeDates).toEqual([]);

    setUser("user-a");
    expect(getReadingStats().streak).toBe(1);
  });

  it("does not record reading time when signed out", () => {
    setUser(null);
    tickReading(30);
    expect(getReadingStats().streak).toBe(0);
    expect(localStorage.getItem("shelf:reading-stats")).toBeNull();
  });

  it("does not hand a leftover unkeyed streak to a new account", () => {
    localStorage.setItem(
      "shelf:reading-stats",
      JSON.stringify({
        streak: 3,
        lastActiveDate: "2026-08-22",
        todaySeconds: 0,
        activeDates: ["2026-08-20", "2026-08-21", "2026-08-22"],
      })
    );
    adoptUnkeyedReadingStats(null);
    setUser("user-b");
    expect(getReadingStats().streak).toBe(0);
    expect(localStorage.getItem("shelf:reading-stats")).toBeNull();
  });
});
