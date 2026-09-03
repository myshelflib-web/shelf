import { describe, expect, it, beforeEach } from "vitest";
import {
  finishDeleteProgress,
  getDeleteProgressJobs,
  resetDeleteProgressForTests,
  runDeleteWithProgress,
  startDeleteProgress,
} from "./deleteProgress";

describe("deleteProgress", () => {
  beforeEach(() => {
    resetDeleteProgressForTests();
  });

  it("tracks start and finish", () => {
    const id = startDeleteProgress('Deleting "Notes"…');
    expect(getDeleteProgressJobs()).toHaveLength(1);
    expect(getDeleteProgressJobs()[0]?.label).toContain("Notes");
    finishDeleteProgress(id);
    expect(getDeleteProgressJobs()).toHaveLength(0);
  });

  it("clears progress after runDeleteWithProgress resolves or rejects", async () => {
    await runDeleteWithProgress("Deleting…", async () => "ok");
    expect(getDeleteProgressJobs()).toHaveLength(0);

    await expect(
      runDeleteWithProgress("Deleting…", async () => {
        throw new Error("fail");
      })
    ).rejects.toThrow("fail");
    expect(getDeleteProgressJobs()).toHaveLength(0);
  });
});
