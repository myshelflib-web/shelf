import { longPost } from "../../longPost";

export const chatWithPdfAi = longPost(
  {
    slug: "chat-with-pdf-ai",
    title: "Chat with PDF AI: Ask Questions, Summarize & Study Your Uploads",
    description:
      "How to chat with PDF using AI on Shelf: upload textbooks, ask questions with citations, summarize chapters, and continue across your library — free Study AI limits included.",
    excerpt:
      "Chat-with-PDF is more than a gimmick when answers cite your file and live inside a real study library with quizzes and notes.",
    publishedAt: "2026-09-11",
    tags: ["chat with PDF", "Study AI", "PDF", "LLM", "students"],
  },
  [
    {
      heading: "What “chat with PDF” should mean",
      paragraphs: [
        "You upload a PDF, ask a question in plain language, and get an answer grounded in that document — ideally with a citation you can open.",
        "Weak tools hallucinate page numbers. Strong tools retrieve text (and handle scans carefully) before answering.",
      ],
    },
    {
      heading: "How Shelf does PDF chat",
      paragraphs: [
        "Study AI embeds your question, retrieves chunks from indexed pages, and answers with citations. Ask from a highlight, the open page, or library-wide scope.",
      ],
    },
    {
      heading: "Beyond one file",
      paragraphs: [
        "Exam prep rarely lives in a single PDF. Shelf keeps chat inside collections so you can ask across notes, coaching PDFs, and Docs.",
      ],
    },
    {
      heading: "Summaries and mind maps",
      paragraphs: [
        "From the same reader, generate chapter summaries, bullet notes, or mind maps — still grounded in the upload.",
      ],
    },
    {
      heading: "Free vs Premium",
      paragraphs: [
        "Free includes Study AI with monthly token limits. Premium raises limits and unlocks Standard/Deep modes for heavier tutoring sessions.",
      ],
    },
    {
      heading: "Try it",
      paragraphs: [
        "Sign in, upload one PDF, open Study AI, and ask a question you already know the answer to — verify the citation. Product page: /features/chat-with-pdf.",
      ],
    },
  ]
);
