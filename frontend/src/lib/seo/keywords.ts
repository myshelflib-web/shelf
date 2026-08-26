/**
 * SEO keywords for Shelf — multi-audience personal study library.
 * Exam prep is one audience among many (students, professionals, researchers).
 */
export const SEO_KEYWORDS = {
  product: [
    "personal study library",
    "PDF reader with highlights",
    "AI study assistant",
    "chat with PDF",
    "PDF annotation app",
    "study planner app",
    "organize PDF notes",
    "AI notes from PDF",
    "mind map from PDF",
    "digital notebook for students",
  ],
  audiences: [
    "college study notes app",
    "law student PDF library",
    "medical student notes",
    "research paper reader",
    "exam preparation app",
    "UPSC study material",
    "NEET JEE notes organizer",
    "professional PDF workspace",
    "teacher lesson materials",
    "language learning PDF notes",
  ],
  longTail: [
    "organize coaching PDFs",
    "study AI from your own notes",
    "offline PDF study app",
    "split screen PDF reader",
    "revision calendar for students",
    "private PDF library",
    "highlight and ask AI on PDF",
    "cross device reading progress",
  ],
} as const;

/** Default meta keywords (≤20, product-first). */
export const DEFAULT_KEYWORDS: string[] = [
  "personal study library",
  "PDF reader with highlights",
  "Study AI",
  "AI study assistant",
  "PDF annotation",
  "organize PDF notes",
  "study planner app",
  "chat with PDF",
  "digital notebook",
  "mind map from PDF",
  "exam preparation",
  "revision calendar",
  "offline PDF reader",
  "college notes app",
  "private study workspace",
];

/** Per-blog-slug extra SEO tags merged at read time. */
export const BLOG_SEO_KEYWORDS: Record<string, string[]> = {
  "personal-study-library-collections": [
    "organize PDF notes",
    "study library app",
    "digital filing system students",
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
    "PDF question answering",
    "cross document AI chat",
  ],
  "study-ai-stop-queue-diagrams": [
    "stop AI generation",
    "queue chat messages",
    "mermaid diagram preview",
    "Google search study AI",
  ],
  "study-ai-summaries-mind-maps": [
    "mind map from PDF",
    "AI summary notes",
    "PDF to mind map",
  ],
  "goal-aware-study-ai": [
    "study goal settings",
    "exam-aware AI tutor",
    "personalized study AI",
  ],
  "planner-tasks-events-calendar": [
    "study planner app",
    "revision calendar",
    "study schedule app",
  ],
  "study-dashboard-streak-achievements": [
    "study streak app",
    "reading tracker students",
    "study habit dashboard",
  ],
  "reader-workspace-tabs-split-view": [
    "split screen PDF reader",
    "compare PDF notes",
    "multi tab study reader",
  ],
  "sketch-notebook-and-doc-pages": [
    "digital notebook for students",
    "sketch notes app",
    "typed notes beside PDF",
  ],
  "free-exam-curriculum-learn": [
    "free study curriculum",
    "open syllabus library",
    "NCERT and exam packs",
  ],
  "shelf-premium-subscription": [
    "study app premium",
    "AI study subscription",
    "PDF library storage",
  ],
  "cross-device-reading-progress": [
    "sync PDF reading progress",
    "cross device study app",
  ],
  "keyboard-shortcuts-command-search": [
    "study app shortcuts",
    "command palette search",
  ],
  "spotify-focus-audio-while-reading": [
    "focus music while studying",
    "Spotify study app",
  ],
  "pwa-offline-study-app": [
    "offline PDF reader app",
    "PWA study app",
  ],
  "getting-started-with-shelf": [
    "how to use Shelf",
    "getting started study library",
  ],
  "how-to-upload-organize-pdfs": [
    "upload PDF study notes",
    "organize PDF folders",
  ],
  "college-students-lecture-notes": [
    "college lecture notes app",
    "university PDF organizer",
  ],
  "law-students-case-law-library": [
    "law student case briefs",
    "legal PDF annotation",
  ],
  "medical-and-science-pdf-workflow": [
    "medical student notes app",
    "science journal PDF reader",
  ],
  "research-papers-literature-notes": [
    "research paper highlighter",
    "literature review PDF tool",
  ],
  "professionals-work-documents": [
    "professional PDF workspace",
    "annotate work documents",
  ],
  "teachers-lesson-materials": [
    "teacher lesson plan PDFs",
    "educators study library",
  ],
  "privacy-private-study-library": [
    "private PDF library",
    "secure study notes app",
  ],
  "shelf-vs-generic-chatbots": [
    "AI grounded in your notes",
    "chat with your PDFs vs ChatGPT",
  ],
  "dark-mode-focused-reading": [
    "dark mode PDF reader",
    "focus reading app",
  ],
  "pin-collections-continue-reading": [
    "pin study collections",
    "continue reading PDF",
  ],
  "language-learning-with-pdfs": [
    "language learning PDF notes",
    "annotate textbooks foreign language",
  ],
  "nonfiction-book-notes": [
    "book notes PDF app",
    "nonfiction reading highlights",
  ],
  "search-your-entire-library": [
    "search PDF library",
    "find notes across collections",
  ],
};

export const HOME_TITLE =
  "Shelf — Personal Study Library | PDF Highlights, Study AI & Planner";

export const HOME_DESCRIPTION =
  "Build a private study library for any goal: upload PDFs, highlight as you read, ask Study AI from your material, and plan work on one calendar. Free curriculum packs available — used by students, professionals, and lifelong learners.";

export const LEARN_DESCRIPTION =
  "Browse free curriculum packs — syllabus articles, textbooks, and topic guides. Open without signing up; sign in to keep a parallel private library of your own PDFs and notes.";

export const BLOG_INDEX_DESCRIPTION =
  "Long-form guides to Shelf: personal PDF libraries, highlights, Study AI, planner, reader workspace, and workflows for students, researchers, and professionals.";
