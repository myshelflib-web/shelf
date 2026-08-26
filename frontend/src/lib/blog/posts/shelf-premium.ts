import { buildPost } from "../types";

export const shelfPremium = buildPost(
  {
    slug: "shelf-premium-subscription",
    title: "Shelf Premium: Storage, Study AI Tokens, and Vector Search",
    description:
      "Upgrade to Shelf Premium for 10 GB storage, 2M Study AI tokens per month, deeper library vector indexing, and longer chat threads. Coupons, affiliate coins, and UPI Autopay.",
    excerpt:
      "Free Shelf is fully usable at 250 MB and 50k AI tokens monthly. Premium expands limits for heavy PDF libraries and daily Study AI workflows — with coupons, referrals, and optional monthly/yearly UPI Autopay.",
    publishedAt: "2026-02-18",
    updatedAt: "2026-08-26",
    tags: ["premium", "subscription", "pricing", "study ai", "coupons", "affiliate"],
    readingMinutes: 6,
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
        "Subscribe from /subscribe when signed in. Choose a one-time Premium purchase, or monthly/yearly UPI Autopay (Razorpay mandate). After payment verification your account flips to Premium with a subscription expiry date. You can renew anytime to extend access, and you receive a confirmation email when activation succeeds.",
      ],
    },
    {
      heading: "Coupons and affiliate coins",
      paragraphs: [
        "Admins can create percent or fixed coupon codes with usage caps and validity windows. At checkout, enter a code to reduce the amount charged. Any signed-in user can share an affiliate link from Settings; when someone upgrades through that link, the referrer earns Shelf coins (default 10% of the amount paid). Coins apply as credit on one-time upgrades and renewals — no cash payouts.",
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
