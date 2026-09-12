import { longPost } from "../../longPost";

export const vsNotebooklm = longPost(
  {
    slug: "shelf-vs-notebooklm",
    title: "Shelf vs NotebookLM: Personal Study Library vs Source Notebooks",
    description:
      "Compare Shelf and Google NotebookLM for storing PDFs and asking an LLM. Shelf adds a full study library, highlights, quizzes, and planner; NotebookLM focuses on source notebooks.",
    excerpt:
      "NotebookLM is strong for chatting with a set of sources. Shelf is a personal study library where Study AI (an LLM) lives beside reading, notes, quizzes, and planning.",
    publishedAt: "2026-09-11",
    tags: ["comparison", "NotebookLM", "Study AI", "LLM", "PDF"],
  },
  [
    {
      heading: "What both tools get right",
      paragraphs: [
        "Both Shelf and NotebookLM help you ask an LLM about documents you provide instead of hoping a generic chatbot remembers your textbook.",
        "If your only need is a short-lived notebook over a handful of PDFs, NotebookLM is a reasonable starting point.",
      ],
    },
    {
      heading: "Where Shelf differs: durable library, not only notebooks",
      paragraphs: [
        "Shelf’s home is a personal study library: collections, topics, root pages, YouTube lectures, sketch notebooks, and research Docs with citations.",
        "Study AI sits inside that library — ask from a highlight while reading, or open library-wide chat — so Q&A does not replace your filing system.",
      ],
    },
    {
      heading: "Reading and annotation",
      paragraphs: [
        "Shelf’s reader supports highlights, tabs, split view, and progress sync across devices. Marks stay on the page and can seed Study AI questions.",
        "If your workflow is “read deeply for months,” a dedicated reader plus library matters as much as the chat box.",
      ],
    },
    {
      heading: "Practice and planning",
      paragraphs: [
        "Shelf can turn scoped material into exam-style quizzes and schedule revision tasks linked to pages. NotebookLM’s strength is synthesis and audio-style overviews, not a full planner or proctored quiz workspace.",
      ],
    },
    {
      heading: "When to prefer NotebookLM",
      paragraphs: [
        "Choose NotebookLM when you already live in Google’s ecosystem, need a quick source notebook for a project, and do not need long-term library organization, quizzes, or a study calendar.",
      ],
    },
    {
      heading: "When to prefer Shelf",
      paragraphs: [
        "Choose Shelf when you want one place to store notes and PDFs over a semester or exam cycle, then ask Study AI (an LLM grounded in that library) without losing highlights, search, quizzes, and planning.",
        "Start at myshelflib.com or read /features/notes-pdfs-ask-llm for the combined store-and-ask workflow.",
      ],
    },
  ]
);
