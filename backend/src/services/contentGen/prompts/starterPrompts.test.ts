import { describe, expect, it } from "vitest";
import type { GeneratedArticle, ResolvedArticleSpec } from "../types.js";
import { recheckMessages } from "./starterPrompts.js";

const spec: ResolvedArticleSpec = {
  slug: "feynman-technique",
  title: "Explain-It-Simply as a Gap Detector",
  syllabusAnchor:
    "Explain-It-Simply as a Gap Detector. Study skills: encoding, storage and retrieval — testing, spacing, interleaving, notes and dual coding.",
  mustCover: [
    "Explain the idea aloud without notes",
    "Every skipped step marks a hole",
  ],
  officialSources: [],
  diagram: "flow",
  keywords: ["Feynman"],
  subjectSlug: "study-skills-learning",
  subjectName: "Learning Science",
  subjectDescription: "Study skills",
  topicSlug: "notes-and-encoding",
  topicTitle: "Notes",
};

const draft: GeneratedArticle = {
  title: spec.title,
  metaDescription: "Find holes by explaining simply.",
  intro: "Explain without notes.",
  sections: [
    { heading: "The method", paragraphs: ["Talk it through."] },
    { heading: "The hole", paragraphs: ["Jargon is a flag."] },
    { heading: "The retry", paragraphs: ["Re-read only the hole."] },
  ],
  keyTakeaways: ["Time-box it"],
  examPointers: [],
  commonMistakes: [],
  linkages: [],
  diagram: null,
  glance: null,
  keywords: ["Feynman"],
};

describe("recheckMessages", () => {
  it("tells the auditor not to treat sibling skills as missing coverage", () => {
    const user = recheckMessages({ label: "Shelf" }, spec, draft)[1]?.content ?? "";
    expect(user).toContain("this is the only list that can go in \"missing\"");
    expect(user).toContain("Do not put sibling skills");
    expect(user).toContain("A dedicated heading is not required");
  });
});
