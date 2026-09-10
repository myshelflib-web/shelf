import { describe, expect, it } from "vitest";
import { syncStatusFromEvent, type SyncStatusDetail } from "./syncStatus";

describe("syncStatusFromEvent", () => {
  it("reads a sync status custom event", () => {
    const detail: SyncStatusDetail = { state: "synced", label: "Synced" };
    const e = new CustomEvent("shelf:sync-status", { detail });
    expect(syncStatusFromEvent(e)).toEqual(detail);
  });

  it("returns null for unrelated events", () => {
    expect(syncStatusFromEvent(new Event("click"))).toBeNull();
  });
});
