import { buildPost } from "../types";

export const studyAiPageAsk = buildPost(
  {
    slug: "study-ai-ask-from-your-pdfs",
    title: "Ask Study AI From Any Page or Highlight in Your Library",
    description:
      "Study AI on Shelf answers from your uploaded PDFs and notes — not the open web. Ask from a selection, the full page, or saved page-scoped chat threads.",
    excerpt:
      "Highlight a paragraph or open Ask AI on the whole page. Answers cite your material and save as threads you can continue in the full Study AI workspace.",
    publishedAt: "2026-01-22",
    updatedAt: "2026-08-26",
    tags: ["study ai", "pdf", "highlights", "rag"],
    readingMinutes: 6,
  },
  [
    {
      heading: "Answers from your uploads, not generic chat",
      paragraphs: [
        "Shelf's reader includes a Study AI panel beside your document. Questions run through a retrieval pipeline that searches indexed chunks of your library — vector search when configured, keyword fallback otherwise — and composes answers with citations back to collection, topic, and page titles.",
        "That means when you ask \"Explain this case's ratio decidendi,\" the model sees excerpts from the PDF you actually uploaded, not a hallucinated textbook.",
      ],
    },
    {
      heading: "Selection-aware questions",
      paragraphs: [
        "Select text before asking to narrow context to that passage — ideal for dense judgments, formulae, or definitions. With nothing selected, Study AI uses the whole file: retrieved chunks spread across that PDF, plus the page you are looking at.",
        "Scanned or image-only PDFs often have no copyable text. Study AI then sends a snapshot of the visible PDF page and still searches any indexed text from the rest of the file. Use ⌘L (Ctrl+L on Windows) from the reader to ask with the current selection, Cursor-style.",
      ],
    },
    {
      heading: "Saved page threads",
      paragraphs: [
        "Each document can keep one saved page-scoped thread. Reopen the PDF and your prior Q&A restores in the reader panel. If a reply fails, the question stays in the thread instead of the chat vanishing. Jump to /study-ai/[id] to continue the same conversation with full history, images, and library scope controls.",
      ],
    },
    {
      heading: "Goal-aware formatting",
      paragraphs: [
        "Set a study goal in Settings — UPSC, Judiciary, NEET PG, GATE, and more — and Study AI tunes tone and structure. Answers use Markdown headings, lists, and comparison tables when useful, so outputs paste cleanly into revision notes.",
      ],
    },
  ]
);
