import { longPost } from "../../longPost";

export const vsObsidian = longPost(
  {
    slug: "shelf-vs-obsidian",
    title: "Shelf vs Obsidian: PDF Study Library + LLM vs Linked Notes",
    description:
      "Compare Shelf and Obsidian for students. Obsidian excels at linked Markdown; Shelf adds a PDF library, Study AI (LLM), quizzes, and planner — an Obsidian-style stack without five plugins.",
    excerpt:
      "Obsidian is a powerful second brain for Markdown. Shelf is a study workspace centered on PDFs, Docs, and an LLM grounded in your uploads.",
    publishedAt: "2026-09-11",
    tags: ["comparison", "Obsidian", "Study AI", "PDF", "students"],
  },
  [
    {
      heading: "Different strengths",
      paragraphs: [
        "Obsidian is outstanding for networked Markdown, plugins, and local-first note graphs.",
        "Shelf is outstanding when most of your corpus is PDFs and class notes you need to read, highlight, ask an LLM about, and quiz from.",
      ],
    },
    {
      heading: "PDFs without plugin fatigue",
      paragraphs: [
        "Shelf’s reader, highlights, tabs, and split view are built-in. You do not need a plugin stack to annotate a coaching PDF and ask a follow-up question on the selection.",
      ],
    },
    {
      heading: "LLM grounded in the library",
      paragraphs: [
        "Study AI retrieves from indexed Shelf pages with citations and scope filters. Many Obsidian AI plugins chat with notes; fewer deliver a full library + quiz + planner product around that chat.",
      ],
    },
    {
      heading: "When Obsidian is better",
      paragraphs: [
        "Prefer Obsidian if your primary artifacts are Markdown evergreen notes, you love local files and plugins, and PDFs are occasional attachments.",
      ],
    },
    {
      heading: "When Shelf is better",
      paragraphs: [
        "Prefer Shelf if you searched for an Obsidian alternative for students that includes PDFs, ask-an-LLM, quizzes, and a calendar — or you want Notion + NotebookLM + notes without maintaining the glue.",
      ],
    },
    {
      heading: "Using both",
      paragraphs: [
        "Some learners keep evergreen notes in Obsidian and exam PDFs in Shelf. Others move the whole study loop into Shelf’s all-in-one workspace. See /features/all-in-one-study-workspace.",
      ],
    },
  ]
);
