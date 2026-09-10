import { describe, expect, it, beforeEach } from "vitest";
import {
  applyUploadProgressToActivity,
  beginUploadActivity,
  finishUploadActivity,
  listSyncActivities,
  removeSyncActivity,
} from "./syncActivityStore";

describe("syncActivityStore", () => {
  beforeEach(() => {
    for (const item of listSyncActivities()) {
      removeSyncActivity(item.id);
    }
  });

  it("tracks upload progress then done", () => {
    const id = beginUploadActivity("Notes.pdf");
    applyUploadProgressToActivity(
      { loaded: 50, total: 100, percent: 50, phase: "uploading" },
      id
    );
    let items = listSyncActivities();
    expect(items).toHaveLength(1);
    expect(items[0]?.status).toBe("uploading");
    expect(items[0]?.percent).toBe(50);

    finishUploadActivity(id, "done");
    items = listSyncActivities();
    expect(items[0]?.status).toBe("done");
  });
});
