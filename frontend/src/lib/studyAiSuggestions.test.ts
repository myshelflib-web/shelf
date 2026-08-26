import { describe, expect, it } from "vitest";
import { pickStudyAiSuggestions } from "./studyAiSuggestions";

describe("pickStudyAiSuggestions", () => {
  it("rotates the set when the slot advances", () => {
    const a = pickStudyAiSuggestions("library", {
      slot: 1,
      sessionSeed: "s",
      count: 3,
    }).map((x) => x.id);
    const b = pickStudyAiSuggestions("library", {
      slot: 4,
      sessionSeed: "s",
      count: 3,
    }).map((x) => x.id);
    expect(a).toHaveLength(3);
    expect(new Set(a).size).toBe(3);
    expect(a.join()).not.toBe(b.join());
  });
});
