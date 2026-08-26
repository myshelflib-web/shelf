import { describe, expect, it } from "vitest";
import {
  messageIdsFromInclusive,
  messageIdsFromIndex,
  messageIdsToDelete,
} from "./chatMessages.js";

describe("messageIdsToDelete", () => {
  const turns = [
    { id: "u1", role: "user" },
    { id: "a1", role: "assistant" },
    { id: "u2", role: "user" },
    { id: "a2", role: "assistant" },
  ];

  it("removes a user turn and the following assistant reply", () => {
    expect(messageIdsToDelete(turns, "u1")).toEqual(["u1", "a1"]);
  });

  it("removes only the assistant when deleting an answer", () => {
    expect(messageIdsToDelete(turns, "a2")).toEqual(["a2"]);
  });

  it("returns null for a missing id", () => {
    expect(messageIdsToDelete(turns, "nope")).toBeNull();
  });
});

describe("messageIdsFromInclusive", () => {
  const turns = [
    { id: "u1", role: "user" },
    { id: "a1", role: "assistant" },
    { id: "u2", role: "user" },
    { id: "a2", role: "assistant" },
  ];

  it("truncates from a user turn through the rest of the thread", () => {
    expect(messageIdsFromInclusive(turns, "u1")).toEqual([
      "u1",
      "a1",
      "u2",
      "a2",
    ]);
    expect(messageIdsFromInclusive(turns, "u2")).toEqual(["u2", "a2"]);
  });

  it("rejects assistant ids and missing ids", () => {
    expect(messageIdsFromInclusive(turns, "a1")).toBeNull();
    expect(messageIdsFromInclusive(turns, "nope")).toBeNull();
  });
});

describe("messageIdsFromIndex", () => {
  const turns = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("keeps the prefix and drops from the index onward", () => {
    expect(messageIdsFromIndex(turns, 1)).toEqual(["b", "c"]);
    expect(messageIdsFromIndex(turns, 3)).toEqual([]);
  });

  it("rejects a negative index", () => {
    expect(messageIdsFromIndex(turns, -1)).toBeNull();
  });
});
