import type { ShelfFeature } from "../featureTypes";

export const PLATFORM_FEATURES: ShelfFeature[] = [

  {
slug: "pwa-offline",
    category: "platform",
    title: "Offline PDF Study App (PWA) | Shelf",
    metaDescription:
      "Install Shelf as a PWA for offline-friendly study. Cached library metadata and reading workflows help you revise when connectivity is spotty.",
    keywords: [
      "offline PDF reader app",
      "PWA study app",
      "install study app home screen",
      "offline revision app",
    ],
    headline: "Install Shelf on your device",
    subhead:
      "Shelf works as a progressive web app — add to home screen on phone or desktop for an app-like shell with offline-aware library caching.",
    bullets: [
      "Add to home screen on iOS and Android",
      "Cached library structure for faster reopen",
      "Dark theme tuned for long reading sessions",
      "Sign in once; sync when back online",
    ],
    paragraphs: [
      "Commutes and coaching halls do not always have reliable data. PWA install plus cached metadata keeps your library navigable until you are back on Wi‑Fi.",
    ],
    relatedBlogSlug: "pwa-offline-study-app",
    ctaHref: "/login",
    ctaLabel: "Install Shelf",
  },
{
    slug: "cross-device-sync",
    category: "platform",
    title: "Cross-Device Reading Progress & Sync | Shelf",
    metaDescription:
      "Open Shelf on laptop or phone and pick up where you left off. Reading progress, library structure, and Study AI threads sync when you are signed in.",
    keywords: [
      "sync PDF reading progress",
      "cross device study app",
      "cloud study library sync",
      "read PDF on phone and laptop",
    ],
    headline: "Same library on every device",
    subhead:
      "Sign in to sync last-read pages, collections, and Study AI threads across browsers and devices.",
    bullets: [
      "Per-page reading progress in the cloud",
      "Collection pin and order follow your account",
      "Study AI chat history server-side",
      "IndexedDB byte cache speeds PDF reopen locally",
    ],
    paragraphs: [
      "Morning revision on phone, deep reading on laptop at night — Shelf keeps one continuous library instead of duplicate Downloads folders per device.",
    ],
    relatedBlogSlug: "cross-device-reading-progress",
    ctaHref: "/login",
    ctaLabel: "Sync your library",
  },
{
    slug: "keyboard-shortcuts",
    category: "platform",
    title: "Keyboard Shortcuts & Command Search | Shelf",
    metaDescription:
      "Navigate Shelf faster with keyboard shortcuts and command palette search. Jump to Study AI, Quiz, planner, and library pages without reaching for the mouse.",
    keywords: [
      "study app keyboard shortcuts",
      "command palette search",
      "power user study app",
      "shortcut PDF reader",
    ],
    headline: "Shortcuts for power users",
    subhead:
      "Command palette search and key chords open Study AI, Quiz, planner, and library destinations from anywhere in the app.",
    bullets: [
      "Command palette for pages and actions",
      "Reader and workspace navigation shortcuts",
      "g then q opens Quiz from many surfaces",
      "Designed for long desktop study sessions",
    ],
    paragraphs: [
      "When you live in Shelf for hours, mouse travel adds up. Shortcuts mirror patterns from IDEs — fast navigation without breaking reading flow.",
    ],
    relatedBlogSlug: "keyboard-shortcuts-command-search",
    ctaHref: "/login",
    ctaLabel: "Learn shortcuts",
  },
{
    slug: "free-curriculum",
    category: "platform",
    title: "Free Study Curriculum on Shelf Learn | Shelf",
    metaDescription:
      "Browse free syllabus articles, textbooks, and topic guides on Shelf Learn — no sign-in required. Optional packs alongside your private PDF library.",
    keywords: [
      "free study curriculum",
      "open educational resources India",
      "free exam study material",
      "online syllabus library",
      "GATE syllabus",
      "UPSC syllabus",
      "NEET PG syllabus",
    ],
    headline: "Free curriculum packs on Learn",
    subhead:
      "/learn is a public Subject → Topic → Article catalog — separate from your private uploads on /my-content.",
    bullets: [
      "Browse without an account",
      "Syllabus-style articles and official PDFs",
      "Optional baseline reading alongside your uploads",
      "Sign in to highlight and build a parallel private library",
    ],
    paragraphs: [
      "Shelf Learn is an optional funnel for discovery and shared reading lists, while My Content remains the private study workspace most users rely on. Named exam tracks live under /learn when you want them.",
    ],
    relatedBlogSlug: "free-exam-curriculum-learn",
    ctaHref: "/learn",
    ctaLabel: "Browse Learn",
  },
{
    slug: "shelf-premium",
    category: "platform",
    title: "Shelf Premium — Expanded Library & Study AI | Shelf",
    metaDescription:
      "Upgrade to Shelf Premium for a larger personal library, heavier daily Study AI use, Standard & Deep answer modes, longer threads, and deeper search. Razorpay UPI.",
    keywords: [
      "study app premium India",
      "AI study subscription",
      "PDF library premium",
      "Shelf Premium pricing",
    ],
    headline: "More room for serious study",
    subhead:
      "Premium is for students who keep a large PDF library and use Study AI every day — more storage headroom, deeper AI, and advanced answer modes.",
    bullets: [
      "Everything included in Free plan",
      "10× more library storage",
      "20× more Study AI usage each month",
      "Standard & Deep answer modes",
      "Coupons, affiliate coins, and UPI Autopay",
    ],
    paragraphs: [
      "Free Shelf is fully usable for casual reading and occasional AI. Premium targets power users with large PDF corpora and daily Study AI workflows across collections.",
    ],
    relatedBlogSlug: "shelf-premium-subscription",
    ctaHref: "/subscribe",
    ctaLabel: "View pricing",
    canonicalPath: "/subscribe",
  },
  {
    slug: "shelf-vs-alternatives",
    category: "platform",
    title:
      "Shelf vs NotebookLM, Notion, Obsidian & ChatPDF — Features & Pricing",
    metaDescription:
      "Compare Shelf to NotebookLM, Notion AI, Obsidian, ChatPDF, and ChatGPT. One study workspace with free AI + quiz; Premium from ~₹149/mo — better stack value than paying for five tools.",
    keywords: [
      "Shelf vs alternatives",
      "best study app features pricing",
      "NotebookLM alternative pricing",
      "Notion AI alternative India",
      "Obsidian alternative students",
      "ChatPDF alternative free",
      "affordable AI study app India",
    ],
    headline: "More study stack. Fairer pricing.",
    subhead:
      "Shelf wins on the combination most students and teachers need — library, Docs, grounded LLM, quizzes, and planner — with a usable free plan and India-friendly Premium instead of stacking five subscriptions.",
    bullets: [
      "Feature breadth: PDF library + Docs + Study AI + quiz + planner in one app",
      "Free plan includes Study AI and exam-style quiz (with fair-use limits)",
      "Premium ~₹149/month or ~₹1299/year via Razorpay UPI — one bill",
      "Grounded answers with citations — not paste-into-ChatGPT workflows",
    ],
    paragraphs: [
      "“Best” depends on the job. If you only need a Markdown graph, Obsidian may win. If you only need a quick source notebook, NotebookLM may win. If you need notes + PDFs + ask an LLM + tests + planning without five apps, Shelf is the stronger all-in-one.",
      "Pricing is part of that win: Free covers real study workflows; Premium expands storage and Study AI for daily power users — typically cheaper than paying separately for a notes app, an AI chat product, and a quiz tool.",
      "Deep dives: NotebookLM, ChatPDF, Notion AI, and Obsidian comparison posts on the blog, plus /subscribe for live plan details.",
    ],
    relatedBlogSlug: "shelf-vs-alternatives-features-pricing",
    ctaHref: "/subscribe",
    ctaLabel: "See Free & Premium",
    secondaryCtaHref: "/features/all-in-one-study-workspace",
    secondaryCtaLabel: "All-in-one workspace",
  },
];
