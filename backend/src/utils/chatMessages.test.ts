import { describe, expect, it } from "vitest";
import { messageIdsToDelete } from "./chatMessages.js";

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
