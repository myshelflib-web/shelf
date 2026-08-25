import { buildPost } from "../types";

export const studyAiLibraryChat = buildPost(
  {
    slug: "study-ai-library-wide-chat",
    title: "Library-Wide Study AI Chat With Scope and Syllabus Docs",
    description:
      "Use Shelf's full Study AI workspace to chat across your entire library, a collection, topic, or single page. Attach syllabus docs and get cited answers.",
    excerpt:
      "The /study-ai workspace is multi-turn chat with RAG over your uploads. Filter scope to a notebook, topic, or page, and optionally inject relevancy documents.",
    publishedAt: "2026-01-25",
    tags: ["study ai", "chat", "library", "rag"],
    readingMinutes: 7,
  },
  [
    {
      heading: "Beyond single-page Q&A",
      paragraphs: [
        "While the reader panel handles quick questions on one document, /study-ai is where longer investigations live: comparing chapters, drafting essay outlines, or tracing themes across multiple PDFs in a collection.",
        "Each thread stores messages server-side (free accounts: 30 messages per thread; Premium: 300). Oldest messages trim automatically so threads stay fast.",
      ],
    },
    {
      heading: "Library scope filters",
      paragraphs: [
        "Every thread has a context kind — LIBRARY, NOTEBOOK, TOPIC, or PAGE — that constrains retrieval. Ask about \"all my Constitutional Law PDFs\" with notebook scope, or zoom into one topic before exams.",
      ],
      bullets: [
        "LIBRARY — search across everything you indexed",
        "NOTEBOOK — one collection only",
        "TOPIC — single topic within a collection",
        "PAGE — one document, like reader Ask AI",
      ],
    },
    {
      heading: "Relevancy and syllabus documents",
      paragraphs: [
        "Paste syllabus text or upload a PDF/txt relevancy doc and attach it to a thread. Study AI injects that document into the system prompt so answers stay aligned with your exam's framing — even when source PDFs are generic.",
        "Free accounts store up to 10 relevancy docs; Premium allows 50.",
      ],
    },
    {
      heading: "Citations and exports",
      paragraphs: [
        "Responses include citations[] with titles and in-app links so you can verify claims in the original PDF. Export or save answer content when you want a permanent note in your workflow.",
      ],
    },
  ]
);
