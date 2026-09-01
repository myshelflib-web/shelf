import { describe, expect, it } from "vitest";
import type { GeneratedArticle, RelevanceReview } from "./types.js";
import { packStarterDraft, parseStarterDraft } from "./starterDraft.js";

const article: GeneratedArticle = {
  title: "Active recall",
  metaDescription: "How to retrieve, not reread.",
  intro: "Retrieval beats highlighting.",
  sections: [
    { heading: "Why", paragraphs: ["Memory is cue-driven."] },
    { heading: "How", paragraphs: ["Close the book and write."] },
    { heading: "When", paragraphs: ["Space the reviews."] },
  ],
  keyTakeaways: ["Test yourself"],
  examPointers: [],
  commonMistakes: [],
  linkages: [],
  diagram: null,
  glance: null,
  keywords: ["recall"],
};

const review: RelevanceReview = {
  score: 65,
  missing: ["Expanding intervals"],
  corrections: ["Show the original textbook page"],
  vague: [],
  verdict: "revise",
};

describe("starterDraft", () => {
  it("round-trips a held article so Retry can revise it", () => {
    const packed = packStarterDraft(article, review);
    const parsed = parseStarterDraft(packed);
    expect(parsed?.article.title).toBe("Active recall");
    expect(parsed?.review.score).toBe(65);
    expect(parsed?.review.missing).toContain("Expanding intervals");
  });

  it("rejects junk so a crash row still full-redrafts", () => {
    expect(parseStarterDraft(null)).toBeNull();
    expect(parseStarterDraft({ kind: "NEWS" })).toBeNull();
  });
});
