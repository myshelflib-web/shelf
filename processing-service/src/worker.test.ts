import { describe, expect, it } from "vitest";
import { pickPendingJobs } from "./worker.js";

describe("pickPendingJobs", () => {
  it("skips in-flight ids and caps the batch", () => {
    const jobs = [
      { topicId: "a" },
      { topicId: "b" },
      { topicId: "c" },
    ];
    expect(pickPendingJobs(jobs, ["b"], 2)).toEqual([
      { topicId: "a" },
      { topicId: "c" },
    ]);
    expect(pickPendingJobs(jobs, [], 1)).toEqual([{ topicId: "a" }]);
  });

  it("dedupes the same topicId in one poll", () => {
    const jobs = [{ topicId: "a" }, { topicId: "a" }, { topicId: "b" }];
    expect(pickPendingJobs(jobs, [], 5)).toEqual([
      { topicId: "a" },
      { topicId: "b" },
    ]);
  });
});
