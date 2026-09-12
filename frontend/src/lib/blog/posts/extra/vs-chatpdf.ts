import { longPost } from "../../longPost";

export const vsChatpdf = longPost(
  {
    slug: "shelf-vs-chatpdf",
    title: "Shelf vs ChatPDF: Library-Wide Study AI vs Single-File Chat",
    description:
      "ChatPDF popularized chat with a PDF. Shelf stores your whole notes and PDF library, then Study AI — an LLM with RAG — answers across files with citations, quizzes, and a planner.",
    excerpt:
      "ChatPDF is great for one document. Shelf is for students and professionals who need a library of notes and PDFs plus an LLM that can span collections.",
    publishedAt: "2026-09-11",
    tags: ["comparison", "ChatPDF", "Study AI", "chat with PDF", "LLM"],
  },
  [
    {
      heading: "The ChatPDF pattern",
      paragraphs: [
        "Chat-with-PDF tools made a simple promise: upload a file, ask questions, get answers. That solves the “I do not want to re-read chapter 12” moment.",
        "The limit appears when your semester is twenty PDFs, handwritten notes, and lecture links — not one file at a time.",
      ],
    },
    {
      heading: "Shelf’s library-first answer",
      paragraphs: [
        "Shelf stores PDFs and notes in collections, indexes them for search and Study AI, and lets you scope chat to a page, topic, collection, or the whole library.",
        "You still get single-document ask from the reader — but you are not forced to start over for every upload.",
      ],
    },
    {
      heading: "Grounding and citations",
      paragraphs: [
        "Study AI retrieves excerpts from your indexed material and cites sources so you can jump back to the passage. That matters for exams and professional accuracy where hallucinated page numbers waste time.",
      ],
    },
    {
      heading: "Beyond Q&A",
      paragraphs: [
        "Highlights, split reading, exam-style quizzes, Share Shelf, Telegram import, and a revision planner sit beside Study AI. ChatPDF-class tools usually stop at conversation.",
      ],
    },
    {
      heading: "When ChatPDF-style tools are enough",
      paragraphs: [
        "If you only ever need to interrogate one PDF tonight and will discard the chat tomorrow, a lightweight chat-with-PDF product can be faster to open.",
      ],
    },
    {
      heading: "When Shelf is the better fit",
      paragraphs: [
        "If you searched for a tool to store all your notes and PDFs and still ask an LLM, you need library scope — not only single-file chat. Shelf is built for that.",
        "Compare Study AI details at /features/study-ai and the store-and-ask landing at /features/notes-pdfs-ask-llm.",
      ],
    },
  ]
);
