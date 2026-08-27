import { buildPost } from "../types";

export const studyAiPageAsk = buildPost(
  {
    slug: "study-ai-ask-from-your-pdfs",
    title: "Ask Study AI From Any Page or Highlight in Your Library",
    description:
      "Study AI on Shelf answers from your PDFs and notes, general study questions, and can add planner tasks or quizzes from the reader panel.",
    excerpt:
      "Highlight a paragraph or open Ask AI on the whole page. Answers cite your material when relevant, handle off-document questions, and can act on planner and quiz.",
    publishedAt: "2026-01-22",
    updatedAt: "2026-08-27",
    tags: ["study ai", "pdf", "highlights", "rag"],
    readingMinutes: 6,
  },
  [
    {
      heading: "Answers from your uploads — and beyond",
      paragraphs: [
        "Shelf's reader includes a Study AI panel beside your document. Questions about the open file run through a retrieval pipeline that searches indexed chunks of your library — vector search when configured, keyword fallback otherwise — and composes answers with citations back to collection, topic, and page titles.",
        "You can also ask general study questions that are not in the PDF. Study AI answers those helpfully instead of refusing, and can use web search when your library does not cover the topic.",
      ],
    },
    {
      heading: "Selection-aware questions",
      paragraphs: [
        "Select text before asking to narrow context to that passage — ideal for dense judgments, formulae, or definitions. With nothing selected, Study AI uses the whole file: retrieved chunks spread across that PDF, plus the page you are looking at.",
        "Scanned or image-only PDFs are OCR’d into searchable text when indexing (Gemini), then also get a snapshot of the visible page in the reader when copyable text is still thin. Use ⌘L (Ctrl+L on Windows) from the reader to ask with the current selection, Cursor-style.",
      ],
    },
    {
      heading: "Saved page threads",
      paragraphs: [
        "Each document can keep one saved page-scoped thread. Reopen the PDF and your prior Q&A restores in the reader panel. If a reply fails, the question stays in the thread instead of the chat vanishing. Jump to /study-ai/[id] to continue the same conversation with full history, images, and library scope controls.",
      ],
    },
    {
      heading: "Planner and quizzes from Ask",
      paragraphs: [
        "In free-form Ask mode, say “remind me to revise this tomorrow” or “make a quiz on this chapter.” Study AI creates planner items and starts quizzes, then shares links to /planner or /quiz/:id. Summarize, Notes, and Mind map stay document-focused without those actions.",
      ],
    },
  ]
);
