import { describe, expect, it } from "vitest";
import {
  flashcardsToMarkdown,
  hasFlashcardDeck,
  parseFlashcards,
} from "./parseFlashcards";

describe("parseFlashcards", () => {
  it("parses Q/A markdown pairs", () => {
    const md = `
**Q:** What is Article 14?
**A:** Equality before law.

**Q:** What is Article 21?
**A:** Protection of life and personal liberty.
`;
    expect(parseFlashcards(md)).toEqual([
      { front: "What is Article 14?", back: "Equality before law." },
      {
        front: "What is Article 21?",
        back: "Protection of life and personal liberty.",
      },
    ]);
    expect(hasFlashcardDeck(md)).toBe(true);
  });

  it("round-trips via flashcardsToMarkdown", () => {
    const cards = [
      { front: "Front 1", back: "Back 1" },
      { front: "Front 2", back: "Back 2" },
    ];
    expect(parseFlashcards(flashcardsToMarkdown(cards))).toEqual(cards);
  });
});
