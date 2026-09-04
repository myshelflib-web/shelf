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
    updatedAt: "2026-09-04",
    tags: ["library", "collections", "organization", "pdf"],
    readingMinutes: 6,
  },
  [
    {
      heading: "Your material, your structure",
      paragraphs: [
        "Most study apps treat you like a consumer of someone else's catalog. Shelf inverts that: after you sign in, /my-content becomes your home — a workspace for PDFs, YouTube lectures, typed notes, sketch pages, and imported documents you bring yourself.",
        "Top-level folders (collections) hold nested folders and files. You can nest folders up to ten levels deep — enough for exam → paper → subject → topic → subtopic trees — without flattening everything into a two-level maze.",
      ],
    },
    {
      heading: "Flexible page placement",
      paragraphs: [
        "Shelf supports flexible placement without forcing a default \"General\" topic:",
      ],
      bullets: [
        "Library-root pages live directly under /my-content — ideal for one-off readings.",
        "Folder-level pages sit inside any folder in the tree — useful for syllabus overviews or mixed material.",
        "Nest folders under folders (up to 10 levels) when a unit needs chapters, then files under the right leaf.",
      ],
    },
    {
      heading: "Explorer, search, and resume reading",
      paragraphs: [
        "The library sidebar supports search, sort, pagination, and pinning recently opened collections so they stay visible while you browse. Click a folder to expand it; use the folder-plus control on a nested folder to add another level. Shelf remembers the last page you read in a collection and can resume there on any device once you are signed in.",
        "Rename folders and page titles in place — URLs keep stable slugs, so bookmarks and planner links keep working after a rename.",
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
