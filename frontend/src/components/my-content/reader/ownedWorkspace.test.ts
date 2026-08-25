import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  readOwnedWorkspace,
  writeOwnedWorkspace,
  getFocusedWorkspaceHref,
  WORKSPACE_STORAGE_KEY,
  emptyPanesWorkspace,
} from "@/components/my-content/reader/types";

describe("owned reader workspace", () => {
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

  it("ignores and removes workspace from another account", () => {
    localStorage.setItem(
      "user",
      JSON.stringify({ id: "user-b", email: "b@test.com" })
    );
    localStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify({
        userId: "user-a",
        panes: [
          {
            id: "p1",
            tabs: [
              {
                key: "/my-content/file/old",
                href: "/my-content/file/old",
                title: "Old PDF",
                scope: { kind: "root-file", pageSlug: "old" },
              },
            ],
            activeTabKey: "/my-content/file/old",
          },
        ],
        focusedPaneId: "p1",
      })
    );
    expect(readOwnedWorkspace()).toBeNull();
    expect(localStorage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();
    expect(getFocusedWorkspaceHref()).toBeNull();
  });

  it("ignores legacy workspace without userId", () => {
    localStorage.setItem(
      "user",
      JSON.stringify({ id: "user-b", email: "b@test.com" })
    );
    localStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify({
        panes: [
          {
            id: "p1",
            tabs: [
              {
                key: "/my-content/file/old",
                href: "/my-content/file/old",
                title: "Old PDF",
                scope: { kind: "root-file", pageSlug: "old" },
              },
            ],
            activeTabKey: "/my-content/file/old",
          },
        ],
        focusedPaneId: "p1",
      })
    );
    expect(readOwnedWorkspace()).toBeNull();
    expect(getFocusedWorkspaceHref()).toBeNull();
  });

  it("round-trips workspace for the signed-in user", () => {
    localStorage.setItem(
      "user",
      JSON.stringify({ id: "user-a", email: "a@test.com" })
    );
    const state = emptyPanesWorkspace();
    state.panes[0]!.tabs = [
      {
        key: "/my-content/file/notes",
        href: "/my-content/file/notes",
        title: "Notes",
        scope: { kind: "root-file", pageSlug: "notes" },
      },
    ];
    state.panes[0]!.activeTabKey = "/my-content/file/notes";
    writeOwnedWorkspace(state);
    expect(readOwnedWorkspace()?.userId).toBe("user-a");
    expect(getFocusedWorkspaceHref()).toBe("/my-content/file/notes");
  });
});
