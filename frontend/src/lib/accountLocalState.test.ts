import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAccountLocalState,
  bindAccountLocalState,
  ACCOUNT_LOCAL_KEYS,
} from "./accountLocalState";
import { WORKSPACE_STORAGE_KEY } from "@/components/my-content/reader/types";

describe("accountLocalState", () => {
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
      get length() {
        return mem.size;
      },
      key: (i: number) => [...mem.keys()][i] ?? null,
    });
    vi.stubGlobal("window", {
      dispatchEvent: () => true,
    });
  });

  it("clears reader workspace, auth, and every shelf key", () => {
    localStorage.setItem("token", "jwt");
    localStorage.setItem("user", '{"id":"user-a"}');
    localStorage.setItem("theme", "dark");
    localStorage.setItem(WORKSPACE_STORAGE_KEY, '{"panes":[]}');
    localStorage.setItem("shelf:last-read", "{}");
    localStorage.setItem("shelf:spotify-notebook:abc", "url");
    localStorage.setItem("shelf:reading-stats:user-a", '{"streak":3}');
    localStorage.setItem("shelf:pdf-night-mode", "1");
    clearAccountLocalState();
    for (const key of ACCOUNT_LOCAL_KEYS) {
      expect(localStorage.getItem(key)).toBeNull();
    }
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("shelf:spotify-notebook:abc")).toBeNull();
    expect(localStorage.getItem("shelf:reading-stats:user-a")).toBeNull();
    expect(localStorage.getItem("shelf:last-user-id")).toBeNull();
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("clears when a different account signs in", () => {
    localStorage.setItem("shelf:last-user-id", "user-a");
    localStorage.setItem(WORKSPACE_STORAGE_KEY, '{"panes":[{"tabs":[1]}]}');
    bindAccountLocalState("user-b");
    expect(localStorage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem("shelf:last-user-id")).toBe("user-b");
  });

  it("keeps state when the same account signs in again", () => {
    localStorage.setItem("shelf:last-user-id", "user-a");
    localStorage.setItem(WORKSPACE_STORAGE_KEY, '{"panes":[]}');
    bindAccountLocalState("user-a");
    expect(localStorage.getItem(WORKSPACE_STORAGE_KEY)).toBe('{"panes":[]}');
  });

  it("clears when signing in over a different stored user", () => {
    localStorage.setItem(
      "user",
      JSON.stringify({ id: "user-a", email: "a@test.com" })
    );
    localStorage.setItem(WORKSPACE_STORAGE_KEY, '{"panes":[{"tabs":[1]}]}');
    bindAccountLocalState("user-b");
    expect(localStorage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("shelf:last-user-id")).toBe("user-b");
  });

  it("clears leftover tabs when the previous account id is already gone", () => {
    localStorage.setItem(WORKSPACE_STORAGE_KEY, '{"panes":[{"tabs":[1]}]}');
    localStorage.setItem(
      "shelf:reading-stats",
      JSON.stringify({
        streak: 3,
        lastActiveDate: "2026-08-22",
        todaySeconds: 10,
        activeDates: ["2026-08-20", "2026-08-21", "2026-08-22"],
      })
    );
    bindAccountLocalState("user-b");
    expect(localStorage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem("shelf:reading-stats")).toBeNull();
    expect(localStorage.getItem("shelf:reading-stats:user-b")).toBeNull();
    expect(localStorage.getItem("shelf:last-user-id")).toBe("user-b");
  });

  it("drops the previous account streak instead of keeping it around", () => {
    localStorage.setItem("shelf:last-user-id", "user-a");
    localStorage.setItem("shelf:reading-stats:user-a", '{"streak":3}');
    localStorage.setItem(
      "shelf:reading-stats",
      JSON.stringify({
        streak: 3,
        lastActiveDate: "2026-08-22",
        todaySeconds: 0,
        activeDates: ["2026-08-20"],
      })
    );
    bindAccountLocalState("user-b");
    expect(localStorage.getItem("shelf:reading-stats")).toBeNull();
    expect(localStorage.getItem("shelf:reading-stats:user-a")).toBeNull();
    expect(localStorage.getItem("shelf:reading-stats:user-b")).toBeNull();
  });
});
