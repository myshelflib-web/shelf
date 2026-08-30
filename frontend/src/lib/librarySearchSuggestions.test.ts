import { describe, expect, it } from "vitest";
import { pickLibrarySuggestChips } from "./librarySearchSuggestions";

describe("pickLibrarySuggestChips", () => {
  it("returns a stable window for the same slot", () => {
    const a = pickLibrarySuggestChips("learn", {
      slot: 4,
      sessionSeed: "s",
      count: 6,
    });
    const b = pickLibrarySuggestChips("learn", {
      slot: 4,
      sessionSeed: "s",
      count: 6,
    });
    expect(a).toEqual(b);
    expect(a).toHaveLength(6);
    expect(a[0]?.label).toBeTruthy();
  });

  it("advances the window when the slot changes", () => {
    const a = pickLibrarySuggestChips("learn", {
      slot: 3,
      sessionSeed: "s",
      count: 6,
    });
    const b = pickLibrarySuggestChips("learn", {
      slot: 4,
      sessionSeed: "s",
      count: 6,
    });
    expect(a.map((c) => c.id).join("|")).not.toBe(
      b.map((c) => c.id).join("|")
    );
  });

  it("uses a different pool for the personal library", () => {
    const learn = pickLibrarySuggestChips("learn", {
      slot: 1,
      sessionSeed: "s",
      count: 6,
    });
    const library = pickLibrarySuggestChips("library", {
      slot: 1,
      sessionSeed: "s",
      count: 6,
    });
    expect(learn.map((c) => c.id)).not.toEqual(library.map((c) => c.id));
  });
});
