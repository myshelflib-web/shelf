/** Fallback list prices when the API is unavailable (see backend billing env). */
export const PRICING_FALLBACK = {
  yearlyInr: 1299,
  monthlyInr: 149,
  planDays: 365,
} as const;

export const SHELF_PLANS = {
  page: {
    kicker: "Simple, honest pricing",
    title: "Start free. Upgrade when Shelf becomes home",
    intro:
      "Bring your notes in, study at your pace, and only pay when you need more room and deeper Study AI — no pressure, no fine print surprises.",
    footnote:
      "Fair-use limits reset monthly · Razorpay UPI Autopay · Cancel anytime in Settings",
  },
  free: {
    id: "FREE" as const,
    name: "Free",
    tagline: "Everything you need to begin",
    description:
      "Your private library — read, highlight, ask, quiz, and plan. No card required.",
    priceLabel: "₹0",
    periodLabel: "forever",
    features: [
      "Personal library with collections & topics",
      "PDF reader with tabs, split view & highlights",
      "Sketch notebooks & typed doc pages",
      "Study AI grounded in your uploads",
      "Exam-style quiz from your notes",
      "Planner, calendar & reading streaks",
      "Telegram import & document sharing",
      "Browse free curriculum on Learn",
    ],
  },
  premium: {
    id: "PREMIUM" as const,
    name: "Premium",
    tagline: "When you study here every day",
    description:
      "More space and Study AI headroom for full subjects, long PDFs, and daily workflows.",
    priceInr: PRICING_FALLBACK.yearlyInr,
    monthlyInr: PRICING_FALLBACK.monthlyInr,
    planDays: PRICING_FALLBACK.planDays,
    features: [
      "Everything included in Free plan",
      "10× more library storage",
      "20× more Study AI usage each month",
      "Standard & Deep answer modes",
      "10× longer Study AI threads",
      "5× more syllabus / relevancy docs",
      "20× deeper library search indexing",
      "Early access to new features",
    ],
  },
} as const;
