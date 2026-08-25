import { buildPost } from "../types";

export const shelfPremium = buildPost(
  {
    slug: "shelf-premium-subscription",
    title: "Shelf Premium: Storage, Study AI Tokens, and Vector Search",
    description:
      "Upgrade to Shelf Premium for 10 GB storage, 2M Study AI tokens per month, deeper library vector indexing, and longer chat threads. Pay via Razorpay.",
    excerpt:
      "Free Shelf is fully usable at 250 MB and 50k AI tokens monthly. Premium expands limits for heavy PDF libraries and daily Study AI workflows.",
    publishedAt: "2026-02-18",
    tags: ["premium", "subscription", "pricing", "study ai"],
    readingMinutes: 5,
  },
  [
    {
      heading: "Free vs Premium at a glance",
      paragraphs: [
        "Every account starts on the free plan: 250 MB uploads, 50,000 Study AI tokens per month, 500 indexed vector chunks, 30 chat messages per thread, and 10 relevancy docs.",
      ],
      bullets: [
        "Premium — 10 GB storage",
        "Premium — 2,000,000 Study AI tokens / month",
        "Premium — 10,000 indexed vector chunks (LRU eviction when over quota)",
        "Premium — 300 chat messages per thread",
        "Premium — 50 relevancy / syllabus docs",
      ],
    },
    {
      heading: "How billing works",
      paragraphs: [
        "Subscribe from /subscribe when signed in. Shelf creates a Razorpay order in INR; after payment verification your account flips to Premium with a subscription expiry date (default 365 days, configurable on the server). You receive a confirmation email when activation succeeds.",
      ],
    },
    {
      heading: "Who needs Premium",
      paragraphs: [
        "Power users with large PDF corpora, daily Study AI chat across collections, or syllabus docs for multiple exams benefit most. Casual readers who upload a few papers and ask occasional questions often stay comfortably on free.",
      ],
    },
  ]
);
