import { longPost } from "../../longPost";

export const allInOneStudyWorkspace = longPost(
  {
    slug: "all-in-one-study-workspace",
    title:
      "All-in-One Study Workspace: Notion + NotebookLM + Obsidian + Docs in Shelf",
    description:
      "Shelf is an all-in-one study workspace — notes, PDFs, Docs, Study AI (LLM), quizzes, and a planner. The Notion, NotebookLM, Obsidian, and Docs combo students and teachers look for.",
    excerpt:
      "One study tool instead of five: store PDFs and notes, write Docs, ask an LLM grounded in your library, quiz yourself, and plan revision on Shelf.",
    publishedAt: "2026-09-11",
    tags: [
      "study workspace",
      "Notion",
      "NotebookLM",
      "Obsidian",
      "Study AI",
      "students",
    ],
  },
  [
    {
      heading: "Why people stitch five apps together",
      paragraphs: [
        "A typical serious student stack looks like: Obsidian or Notion for notes, a Downloads folder for PDFs, NotebookLM or ChatGPT for questions, a quiz site for practice, and a calendar for deadlines.",
        "Each tool is fine alone. The cost is context switching — and answers that never see the PDF you highlighted last night.",
      ],
    },
    {
      heading: "What “all-in-one” means on Shelf",
      paragraphs: [
        "Shelf’s center is a personal study library. Docs and sketch notebooks live beside PDFs. Study AI is the LLM layer grounded in that library. Quiz and planner close the loop.",
      ],
      bullets: [
        "Library & reader — organize, highlight, tabs, split view",
        "Docs & notebooks — typed research Docs and sketch pages",
        "Study AI — ask an LLM about your own material with citations",
        "Practice & plan — exam-style quizzes and a revision calendar",
      ],
    },
    {
      heading: "Compared with Notion",
      paragraphs: [
        "Notion shines as a general workspace wiki. Shelf treats PDFs as first-class study objects with a dedicated reader and grounded AI on those files — closer to how exam and course prep actually works.",
      ],
    },
    {
      heading: "Compared with NotebookLM",
      paragraphs: [
        "NotebookLM is excellent for chatting with a source set. Shelf keeps a durable library, highlights, quizzes, and planning around that chat — not only notebooks.",
      ],
    },
    {
      heading: "Compared with Obsidian",
      paragraphs: [
        "Obsidian is powerful for linked Markdown. Shelf focuses on PDF-heavy study with Docs beside sources and Study AI that retrieves from uploads — less plugin wrangling for the common student workflow.",
      ],
    },
    {
      heading: "Students and teachers in the same product",
      paragraphs: [
        "Students use Shelf as a study tool to ask an LLM about notes and sit practice papers. Teachers prepare lesson PDFs and tests from the same quiz workspace and share handouts when ready.",
        "See /features/all-in-one-study-workspace for the product landing, and the comparison posts for NotebookLM, ChatPDF, Notion AI, and Obsidian.",
      ],
    },
  ]
);
