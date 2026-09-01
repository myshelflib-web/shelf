import { describe, expect, it } from "vitest";
import { asNewsPlan, asStarterPlan, uniqueStarterEntries } from "./jobPlan.js";

describe("jobPlan", () => {
  it("accepts a compact starter plan and rejects junk", () => {
    const plan = asStarterPlan({
      v: 1,
      kind: "STARTER_PACK",
      entries: [{ subjectSlug: "upsc-polity", topicSlug: "parliament", slug: "ls", title: "Lok Sabha" }],
    });
    expect(plan?.entries).toHaveLength(1);
    expect(asStarterPlan(null)).toBeNull();
    expect(asStarterPlan({ kind: "NEWS_BRIEF", clusters: [] })).toBeNull();
  });

  it("dedupes failed rows into a compact starter plan", () => {
    const entries = uniqueStarterEntries([
      { title: "A", slug: "a", subjectSlug: "ca-acc", topicSlug: "ind-as" },
      { title: "A again", slug: "a", subjectSlug: "ca-acc", topicSlug: "ind-as" },
      { title: "B", slug: "b", subjectSlug: "ca-acc", topicSlug: "ind-as" },
    ]);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.slug).toBe("a");
    expect(entries[1]?.slug).toBe("b");
  });

  it("keeps a held draft on retry so the page is revised not rewritten", () => {
    const entries = uniqueStarterEntries([
      {
        title: "Recall",
        slug: "recall",
        subjectSlug: "skills",
        topicSlug: "retention",
        payload: {
          v: 1,
          kind: "STARTER_DRAFT",
          article: {
            title: "Recall",
            metaDescription: "Retrieve, don't reread.",
            intro: "Test yourself.",
            sections: [
              { heading: "Why", paragraphs: ["Cues matter."] },
              { heading: "How", paragraphs: ["Close the book."] },
              { heading: "When", paragraphs: ["Space it."] },
            ],
            keyTakeaways: ["Retrieve"],
            examPointers: [],
            commonMistakes: [],
            linkages: [],
            diagram: null,
            glance: null,
            keywords: ["recall"],
          },
          review: {
            score: 65,
            missing: ["Expanding intervals"],
            corrections: [],
            vague: [],
            verdict: "revise",
          },
        },
      },
    ]);
    expect(entries[0]?.draft?.review.score).toBe(65);
    expect(entries[0]?.draft?.article.title).toBe("Recall");
  });

  it("accepts a news plan", () => {
    const plan = asNewsPlan({
      v: 1,
      kind: "NEWS_BRIEF",
      topicSlug: "2026-09",
      topicTitle: "September 2026",
      clusters: [],
    });
    expect(plan?.topicSlug).toBe("2026-09");
    expect(asNewsPlan({ kind: "STARTER_PACK", entries: [] })).toBeNull();
  });
});
