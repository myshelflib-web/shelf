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
    title: "Free Exam Curriculum on Shelf Learn | Shelf",
    metaDescription:
      "Browse free syllabus articles and topic guides on Shelf Learn — no sign-in required. Optional packs for UPSC and other goals; pair with your private PDF library.",
    keywords: [
      "free study curriculum",
      "UPSC syllabus online",
      "free exam study material",
      "open educational resources India",
    ],
    headline: "Free curriculum packs on Learn",
    subhead:
      "/learn is a public Subject → Topic → Article catalog — separate from your private uploads on /my-content.",
    bullets: [
      "Browse without an account",
      "SEO-indexed syllabus-style articles",
      "Optional baseline reading alongside your PDFs",
      "Sign in to build a parallel private library",
    ],
    paragraphs: [
      "Shelf Learn is an optional funnel — useful for discovery and syllabus browsing — while My Content remains the private study workspace most users rely on.",
    ],
    relatedBlogSlug: "free-exam-curriculum-learn",
    ctaHref: "/learn",
    ctaLabel: "Browse Learn",
  },
{
    slug: "shelf-premium",
    category: "platform",
    title: "Shelf Premium — 1 GB Storage & 1M Study AI Tokens | Shelf",
    metaDescription:
      "Upgrade to Shelf Premium: 1 GB upload storage, 1 million Study AI tokens per month, Standard & Deep modes, 10k vector chunks, and longer chat threads. Razorpay UPI.",
    keywords: [
      "study app premium India",
      "AI study subscription",
      "PDF library premium",
      "Shelf Premium pricing",
    ],
    headline: "More space and deeper AI",
    subhead:
      "Premium expands storage to 1 GB, Study AI to 1M tokens/month, indexing to 10k chunks, and unlocks Standard & Deep answer modes.",
    bullets: [
      "1 GB upload storage (10× free)",
      "1,000,000 Study AI tokens per month",
      "10,000 indexed vector chunks",
      "300 chat messages per thread",
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
];
