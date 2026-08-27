import { describe, expect, it } from "vitest";
import {
  pickStudyAiFollowUps,
  pickStudyAiHint,
  pickStudyAiSuggestions,
} from "./studyAiSuggestions";

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

  it("includes action chips for planner and quiz", () => {
    const ids = new Set(
      Array.from({ length: 16 }, (_, slot) =>
        pickStudyAiSuggestions("page", {
          slot,
          sessionSeed: "actions",
          count: 4,
        }).map((x) => x.id)
      ).flat()
    );
    expect(ids.has("remind")).toBe(true);
    expect(ids.has("make-quiz")).toBe(true);
    expect(
      pickStudyAiSuggestions("page", {
        slot: 0,
        sessionSeed: "actions",
        count: 4,
      }).some((x) => x.tone === "action")
    ).toBe(true);
  });

  it("picks follow-ups and rotating hints", () => {
    const follow = pickStudyAiFollowUps("library", {
      slot: 0,
      sessionSeed: "f",
      count: 3,
    });
    expect(follow).toHaveLength(3);
    expect(follow.some((f) => f.tone === "action")).toBe(true);
    const hint = pickStudyAiHint("followup", { slot: 1, sessionSeed: "f" });
    expect(hint.length).toBeGreaterThan(4);
  });
});
