import { longPost } from "../../longPost";
import {
  ALTERNATIVE_TOOLS,
  FEATURE_COMPARISON_ROWS,
  PRICING_VALUE_POINTS,
} from "../../../seo/comparisonMatrix";

export const vsAlternativesFeaturesPricing = longPost(
  {
    slug: "shelf-vs-alternatives-features-pricing",
    title:
      "Shelf vs Alternatives: Features & Pricing vs NotebookLM, Notion, Obsidian, ChatPDF",
    description:
      "Honest feature and pricing comparison: Shelf vs NotebookLM, Notion AI, Obsidian, ChatPDF, and ChatGPT. Why the all-in-one study stack plus Free + ~₹149/mo Premium is stronger value.",
    excerpt:
      "Shelf is not the best at every single niche — it is the best value when you need library, Docs, grounded LLM, quizzes, and planning without five subscriptions.",
    publishedAt: "2026-09-11",
    tags: [
      "comparison",
      "pricing",
      "NotebookLM",
      "Notion",
      "Obsidian",
      "ChatPDF",
      "Study AI",
    ],
  },
  [
    {
      heading: "How to read “best” fairly",
      paragraphs: [
        "Marketing pages that claim to beat everyone at everything lose trust. Shelf’s win is the combination: personal PDF library, Docs and notebooks, Study AI grounded in your uploads, exam-style quizzes, Share Shelf, and a planner — with a free plan that already includes AI and quiz under fair-use limits.",
        "If you only need one of those jobs, a specialist tool may still be enough. If you need most of them, Shelf usually beats stitching NotebookLM + Notion + a quiz site + Drive.",
      ],
    },
    {
      heading: "Feature matrix",
      paragraphs: [
        "Here is how Shelf stacks against typical alternatives on the capabilities students and teachers actually search for:",
      ],
      bullets: FEATURE_COMPARISON_ROWS.map(
        (row) =>
          `${row.capability}: Shelf — ${row.shelf}. Alternatives — ${row.typicalAlternatives}.`
      ),
    },
    {
      heading: "Tool-by-tool edges",
      paragraphs: [
        "Use these when you are choosing between Shelf and a named product:",
      ],
      bullets: ALTERNATIVE_TOOLS.map(
        (t) => `${t.name}: ${t.fit}. Shelf edge — ${t.shelfEdge}.`
      ),
    },
    {
      heading: "Pricing: one bill vs a stack",
      paragraphs: [
        "Shelf pricing is designed for India study budgets: Free forever for core workflows, then Premium when the library and Study AI become daily habits.",
      ],
      bullets: [...PRICING_VALUE_POINTS],
    },
    {
      heading: "What Free includes (why this matters)",
      paragraphs: [
        "Many “AI study” products tease a free trial then gate chat. Shelf’s free plan includes a personal library, highlights, Study AI with monthly token limits, exam-style quiz, planner, sharing, and Learn curriculum browsing.",
        "That means you can validate the whole workflow before paying — not just upload one PDF once.",
      ],
    },
    {
      heading: "What Premium adds",
      paragraphs: [
        "Premium expands storage (about 10×), Study AI tokens (about 20×), vector indexing depth, thread length, relevancy docs, and unlocks Standard & Deep answer modes. Checkout uses Razorpay UPI Autopay with optional coupons and affiliate coins.",
        "For heavy exam seasons, one Premium subscription is usually cheaper — and less chaotic — than paying separately for notes AI, chat-with-PDF, and a quiz generator.",
      ],
    },
    {
      heading: "When to pick something else",
      paragraphs: [
        "Pick NotebookLM for a throwaway source notebook. Pick Obsidian for a local Markdown graph with heavy plugins. Pick Notion for team wikis. Pick ChatGPT for open-ended brainstorming with no private corpus.",
        "Pick Shelf when the search intent is “all-in-one study tool” or “store notes and PDFs and ask an LLM” with quizzes and planning attached.",
      ],
    },
    {
      heading: "Next steps",
      paragraphs: [
        "Compare live on /features/shelf-vs-alternatives, check /subscribe for current Free vs Premium, and read individual posts for NotebookLM, ChatPDF, Notion AI, and Obsidian.",
      ],
    },
  ]
);
