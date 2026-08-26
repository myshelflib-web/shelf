import { longPost } from "../../longPost";

export const lawStudents = longPost(
  {
    slug: "law-students-case-law-library",
    title: "Law Students: Build a Case Law Library with Highlights and Study AI",
    description: "Organize judgments, statutes, and briefs in Shelf. Annotate holdings, ask Study AI for ratio summaries, and compare cases in split view — built for law school and judiciary prep.",
    excerpt: "Collections for subjects, topics for doctrines, color-coded highlights for facts vs holdings, and Study AI prompts that stay grounded in the judgments you uploaded.",
    publishedAt: "2026-03-04",
    tags: ["law","case law","judiciary","students"],
  },
  [
    {
      heading: "Structure that matches doctrine",
      paragraphs: [
        "Collections for subjects (Constitutional Law, Contracts). Topics for doctrines or papers. Collection-level pages for syllabus and citation guides.",
        "Upload full judgments as separate pages — one case per page keeps citations and Study AI retrieval clean.",
      ],
    },
    {
      heading: "Color system for cases",
      paragraphs: [
        "Yellow for facts, green for holdings, pink for dissents or doubts, blue for statutes cited. Consistency beats rainbow markup.",
        "Select a holding and ⌘L: Summarize the ratio in two sentences for oral argument practice.",
      ],
    },
    {
      heading: "Bare acts beside judgments",
      paragraphs: [
        "Split view: judgment and bare act. Highlight the article in the act while reading the case that interprets it.",
        "Library-wide chat: Compare how Case A and Case B treat Article X using only my uploads.",
      ],
    },
    {
      heading: "Moot and exam answer practice",
      paragraphs: [
        "Ask Study AI for issue-wise outlines from your brief PDF. Paste into a Shelf doc page and refine with your own voice.",
        "Link planner events to moot rounds and reading deadlines so the library and calendar stay one system.",
      ],
    },
    {
      heading: "Judiciary and bar prep",
      paragraphs: [
        "Set a study goal in Settings when you want answer framing tuned for judiciary-style depth. Goals change tone; your PDFs stay the source of truth.",
        "Keep previous year papers as root pages for quick access during timed practice.",
      ],
    },
    {
      heading: "Citation honesty",
      paragraphs: [
        "Study AI is instructed to prefer retrieved excerpts. Still verify page numbers before citing in filings or exams — treat AI as a clerk, not a co-counsel.",
      ],
    },
    {
      heading: "Long PDF performance",
      paragraphs: [
        "Supreme Court judgments can be long — Shelf streams with range requests. Reopen uses device cache so the second read is faster.",
      ],
    },
    {
      heading: "Career beyond exams",
      paragraphs: [
        "Associates can keep private matter research libraries separate from exam collections. Same tools: highlights, AI grounded in your uploads, planner for filing dates.",
      ],
    }
  ]
);
