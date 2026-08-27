import { describe, expect, it } from "vitest";
import {
  buildBulkDeletePayload,
  pageSelectionKey,
  subjectSelectionKey,
  topicSelectionKey,
  toggleSelectionKey,
} from "./explorerSelection";

describe("explorerSelection", () => {
  it("toggles selection keys", () => {
    const key = pageSelectionKey("p1");
    const next = toggleSelectionKey(new Set(), key);
    expect(next.has(key)).toBe(true);
    expect(toggleSelectionKey(next, key).has(key)).toBe(false);
  });

  it("builds bulk delete payload", () => {
    const selected = new Set([
      subjectSelectionKey("s1"),
      topicSelectionKey("s2", "g1"),
      pageSelectionKey("p1"),
    ]);
    expect(buildBulkDeletePayload(selected)).toEqual({
      subjectIds: ["s1"],
      topicGroups: [{ subjectId: "s2", groupId: "g1" }],
      pageIds: ["p1"],
    });
  });
});
