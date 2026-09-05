import { buildPost } from "../types";

export const studyAiDepthModes = buildPost(
  {
    slug: "study-ai-depth-modes",
    title: "Quick, Standard, and Deep Answers in Study AI",
    description:
      "Choose how thorough Study AI should be: fast crisp replies, standard detail, or Premium Deep mode with map-reduce summaries for long PDFs.",
    excerpt:
      "Toggle Quick, Standard, or Deep before you ask. Deep reads your file section by section and synthesizes long chapter-wise summaries — ideal for 200-page textbooks.",
    publishedAt: "2026-08-28",
    updatedAt: "2026-09-06",
    tags: ["study ai", "summaries", "premium", "rag"],
    readingMinutes: 5,
  },
  [
    {
      heading: "Three answer depths",
      paragraphs: [
        "Every Study AI composer — full workspace and reader panel — now has a depth control under the input. **Quick** keeps the fast, concise answers you already know. **Standard** uses a stronger model, more context from your library, and up to 4,000 tokens of output. **Deep** (Premium) targets long-form analysis with up to 8,000 tokens and prompts tuned for thoroughness.",
      ],
      bullets: [
        "Quick — flash-lite, best for follow-ups and flashcards",
        "Standard — fuller answers without a Premium plan",
        "Deep — Premium; best for textbooks and mains-style writes",
      ],
    },
    {
      heading: "Long PDFs: map-reduce summaries",
      paragraphs: [
        "A 200-page file cannot fit in one model call. When you use Deep mode (or `/deep-summary` on a page), Shelf reads indexed sections in order, summarizes each part, then merges them into one structured answer. You will see progress like “Reading section 3 of 18…” while it works.",
        "Use `/notes` or `/mains` for exam-style long answers. `/analyze` asks for thematic analysis with examples from your file.",
      ],
    },
    {
      heading: "Tips",
      paragraphs: [
        "Your depth choice is remembered in the browser. Deep costs more monthly tokens — check Settings for usage. For a single chapter, Standard is often enough; reserve Deep for full-book revision or judgment analysis.",
      ],
    },
  ]
);
