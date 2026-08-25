/**
 * Target keywords from ASO/web research (India exam prep + AI PDF study tools).
 * Tier 1 = highest search intent/volume for Shelf's market; tier 2 = product-fit long-tail.
 */
export const SEO_KEYWORDS = {
  /** UPSC / IAS / civil services — highest volume in India exam prep */
  examPrep: [
    "UPSC preparation",
    "IAS preparation",
    "UPSC syllabus",
    "UPSC study material",
    "UPSC previous year papers",
    "free UPSC notes",
    "civil services exam preparation",
    "NCERT notes for UPSC",
    "UPSC prelims preparation",
    "UPSC mains preparation",
  ],
  /** Product category — AI PDF & personal library (global + India long-tail) */
  product: [
    "personal study library",
    "PDF reader with highlights",
    "AI study assistant",
    "chat with PDF",
    "PDF annotation app",
    "study planner app",
    "revision calendar for students",
    "mind map from PDF",
    "organize PDF notes",
    "AI notes from PDF",
  ],
  /** India-specific long-tail — lower competition, high conversion */
  longTail: [
    "AI study app for Indian students",
    "UPSC PDF reader with highlights",
    "organize coaching PDFs for UPSC",
    "study AI from your own notes",
    "exam preparation app India",
    "NEET study planner",
    "JEE preparation notes app",
    "offline PDF study app",
  ],
} as const;

/** Default meta keywords (keep ≤20 for crawler focus). */
export const DEFAULT_KEYWORDS: string[] = [
  "personal study library",
  "UPSC preparation",
  "PDF reader highlights",
  "Study AI",
  "IAS preparation",
  "UPSC syllabus",
  "NCERT notes",
  "study planner app",
  "AI PDF notes",
  "exam preparation India",
  "organize PDF notes",
  "revision calendar",
  "free study library",
  "PDF annotation",
  "mind map from PDF",
];

/** Per-blog-slug extra SEO tags merged at read time. */
export const BLOG_SEO_KEYWORDS: Record<string, string[]> = {
  "personal-study-library-collections": [
    "organize PDF notes",
    "UPSC notes organization",
    "study library app",
  ],
  "pdf-reader-highlights-annotations": [
    "PDF reader with highlights",
    "PDF annotation app",
    "highlight PDF for study",
  ],
  "study-ai-ask-from-your-pdfs": [
    "chat with PDF",
    "AI study assistant",
    "ask AI from PDF notes",
  ],
  "study-ai-library-wide-chat": [
    "AI library search",
    "RAG study assistant",
    "PDF question answering",
  ],
  "study-ai-summaries-mind-maps": [
    "mind map from PDF",
    "AI summary notes",
    "PDF to mind map",
  ],
  "goal-aware-study-ai": [
    "UPSC AI assistant",
    "IAS study AI",
    "NEET PG preparation AI",
  ],
  "planner-tasks-events-calendar": [
    "study planner app",
    "revision calendar",
    "exam study schedule",
  ],
  "study-dashboard-streak-achievements": [
    "study streak app",
    "reading tracker students",
    "exam prep dashboard",
  ],
  "reader-workspace-tabs-split-view": [
    "split screen PDF reader",
    "compare PDF notes",
    "multi tab study reader",
  ],
  "sketch-notebook-and-doc-pages": [
    "digital notebook for students",
    "sketch notes app",
    "essay writing study app",
  ],
  "free-exam-curriculum-learn": [
    "free UPSC syllabus",
    "UPSC study material free",
    "NCERT PDF online",
    "free IAS notes",
  ],
  "shelf-premium-subscription": [
    "study app premium",
    "AI study subscription",
    "UPSC prep tools",
  ],
  "cross-device-reading-progress": [
    "sync PDF reading progress",
    "cross device study app",
  ],
  "keyboard-shortcuts-command-search": [
    "study app shortcuts",
    "command palette search",
    "PDF reader keyboard shortcuts",
  ],
  "spotify-focus-audio-while-reading": [
    "focus music while studying",
    "Spotify study app",
  ],
  "pwa-offline-study-app": [
    "offline PDF reader app",
    "PWA study app",
    "install study app home screen",
  ],
};

export const HOME_TITLE =
  "Shelf — Personal Study Library | PDF Highlights, Study AI & UPSC Prep";

export const HOME_DESCRIPTION =
  "Free UPSC syllabus & NCERT study material. Build a personal library: upload PDFs, highlight notes, ask Study AI from your material, and plan revision on one calendar — for IAS, UPSC, NEET & JEE prep.";

export const LEARN_DESCRIPTION =
  "Free UPSC syllabus, NCERT notes, Constitution, Economic Survey & previous year papers. Browse exam curriculum online — no sign-up required.";

export const BLOG_INDEX_DESCRIPTION =
  "Guides for UPSC & competitive exam prep: organize PDF notes, PDF highlights, Study AI on your material, study planner & revision calendar workflows on Shelf.";
