import { buildPost } from "../types";

export const personalStudyLibrary = buildPost(
  {
    slug: "personal-study-library-collections",
    title: "Build a Personal Study Library with Collections and Topics",
    description:
      "Organize PDFs, YouTube lectures, and notes into collections, topics, and root-level pages on Shelf. A private study library you control — not a generic content feed.",
    excerpt:
      "Shelf is built around your material: collections act like notebooks, topics group related pages, and root-level pages sit beside collections for quick access.",
    publishedAt: "2026-01-15",
    updatedAt: "2026-08-29",
    tags: ["library", "collections", "organization", "pdf"],
    readingMinutes: 6,
  },
  [
    {
      heading: "Your material, your structure",
      paragraphs: [
        "Most study apps treat you like a consumer of someone else's catalog. Shelf inverts that: after you sign in, /my-content becomes your home — a workspace for PDFs, YouTube lectures, typed notes, sketch pages, and imported documents you bring yourself.",
        "Collections (sometimes called notebooks in the UI) are top-level folders. Inside a collection you can add topics — thematic groupings like \"Constitutional Law\" or \"Organic Chemistry Unit 3\" — and pages that hold the actual files.",
      ],
    },
    {
      heading: "Flexible page placement",
      paragraphs: [
        "Shelf supports three placement patterns without forcing a default \"General\" topic:",
      ],
      bullets: [
        "Library-root pages live directly under /my-content — ideal for one-off readings.",
        "Collection-level pages sit inside a notebook but outside any topic — useful for syllabus overviews or mixed material.",
        "Topic pages are the classic Collection → Topic → Page hierarchy for deep organization.",
      ],
    },
    {
      heading: "Explorer, search, and resume reading",
      paragraphs: [
        "The library sidebar supports search, sort, pagination, and pinning recently opened collections so they stay visible while you browse. Click a collection to expand it; Shelf remembers the last page you read in that collection and can resume there on any device once you are signed in.",
        "Rename collections, topics, and page titles in place — URLs keep stable slugs, so bookmarks and planner links keep working after a rename.",
      ],
    },
    {
      heading: "Who this is for",
      paragraphs: [
        "Competitive exam candidates juggling dozens of PDFs, law and medical students annotating case law or journals, and anyone who outgrew scattered Downloads folders. If your study material is mostly PDFs and notes you curate yourself, Shelf's library model maps cleanly to how you already think about revision.",
      ],
    },
  ]
);
