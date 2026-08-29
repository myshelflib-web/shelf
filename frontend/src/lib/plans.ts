/** Fallback list prices when the API is unavailable (see backend billing env). */
export const PRICING_FALLBACK = {
  yearlyInr: 1299,
  monthlyInr: 149,
  planDays: 365,
} as const;

export const SHELF_PLANS = {
  page: {
    title: "Plans",
    intro:
      "Your private study library is free to start. Upgrade to Premium when you read, ask, and quiz from your material every day.",
    footnote:
      "Fair-use limits apply and reset monthly. See your current allowance anytime in Settings → Plan usage.",
  },
  free: {
    id: "FREE" as const,
    name: "Free",
    tagline: "Start with your own material",
    description:
      "Bring coaching PDFs, notes, and papers into one place. Read, highlight, ask Study AI, sit quizzes, and plan revision — no credit card required.",
    priceLabel: "₹0",
    periodLabel: "forever",
    features: [
      "Personal library with collections & topics",
      "PDF reader with tabs, split view & highlights",
      "Sketch notebooks & typed doc pages",
      "Study AI grounded in what you uploaded",
      "Exam-style quiz from your notes",
      "Planner, calendar & reading streaks",
      "Telegram import & document sharing",
      "Browse free curriculum on Learn",
    ],
  },
  premium: {
    id: "PREMIUM" as const,
    name: "Premium",
    tagline: "For daily, exam-focused study",
    description:
      "Built for students who live in Shelf — larger libraries, heavier Study AI use, deeper answers on long PDFs, and more room for syllabus context.",
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
