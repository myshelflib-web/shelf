import { buildPost } from "../types";

export const studyAiSummaries = buildPost(
  {
    slug: "study-ai-summaries-mind-maps",
    title: "Summaries, Revision Notes, and Mind Maps From Your PDFs",
    description:
      "Turn long PDF chapters into recaps, bullet notes, and scannable mind maps with Shelf Study AI — grounded in text from your library.",
    excerpt:
      "Ask Study AI to summarize a page, extract revision bullets, or render a mind map. Outputs are structured Markdown you can read, copy, or save.",
    publishedAt: "2026-01-28",
    tags: ["study ai", "summaries", "mind maps", "revision"],
    readingMinutes: 5,
  },
  [
    {
      heading: "From 40 pages to one screen",
      paragraphs: [
        "Long PDFs are painful to re-read the night before an exam. Study AI can compress a chapter into a heading-led summary, pull out definitional bullets, or compare two sections side by side in a table — always referencing the underlying upload.",
      ],
    },
    {
      heading: "Mind maps for visual recall",
      paragraphs: [
        "Ask for a mind map when relationships matter: constitutional articles linked to landmark cases, metabolic pathways, or historical timelines. Shelf renders structured diagrams in the Study AI panel using the same Markdown pipeline as other answers.",
      ],
    },
    {
      heading: "Workflow tips",
      paragraphs: [
        "Start from the reader if you already know the page; use library-scoped chat if the answer should pull from multiple files in a collection. Combine with highlights — select a dense paragraph, ask for a simpler explanation, then highlight the summary-worthy lines yourself.",
      ],
      bullets: [
        "Summarize this page for revision tomorrow",
        "List every test mentioned in this chapter",
        "Compare X and Y in a table with citations",
        "Mind map the key doctrines in this judgment",
      ],
    },
  ]
);
