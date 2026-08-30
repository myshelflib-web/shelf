/**
 * SEO keywords for Shelf — multi-audience personal study library.
 * Exam prep is one audience among many (students, professionals, researchers).
 */
import { BRAND_KEYWORDS } from "./brandIdentity";

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
    "teacher resources for lesson notes",
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
    "save Telegram PDF to library",
    "send PDF back to Telegram",
    "Spotify while reading PDF",
    "YouTube lecture notes",
    "share Shelf documents",
    "share PDF with classmates",
    "exam quiz from your notes",
    "teacher resources for preparing lesson notes",
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
  "exam quiz",
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
  "study-ai-depth-modes": [
    "long PDF summary AI",
    "deep study AI analysis",
    "chapter wise summary",
    "UPSC mains answer AI",
  ],
  "exam-style-quiz-from-your-notes": [
    "exam quiz app",
    "MCQ from PDF",
    "PYQ practice quiz",
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
  "share-study-streak-cards": [
    "study streak share",
    "study progress instagram",
    "reading streak card",
    "exam prep accountability",
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
    "GATE syllabus",
    "UPSC syllabus",
    "NEET PG syllabus",
    "free study curriculum",
    "GATE previous papers",
    "UPSC study material free",
    "State PCS TNPSC",
    "judiciary bare acts",
    "CA study material",
    "open syllabus library",
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
  "youtube-lectures-in-your-library": [
    "YouTube lecture notes",
    "watch YouTube while taking notes",
    "import YouTube playlist study",
  ],
  "share-study-documents": [
    "share shelf",
    "share Shelf documents",
    "share PDF with classmates",
    "collaborative study documents",
    "shared with me study library",
    "share notes with class",
  ],
  "telegram-save-pdfs": [
    "save Telegram PDF to library",
    "Telegram study notes import",
    "forward PDF to study app",
    "send PDF to Telegram",
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
    "college study notes app",
    "organize lecture slides",
  ],
  "law-students-case-law-library": [
    "law student case briefs",
    "legal PDF annotation",
    "law student PDF library",
    "bare acts annotation app",
  ],
  "medical-and-science-pdf-workflow": [
    "medical student notes app",
    "science journal PDF reader",
    "medical PDF annotation",
    "science PDF study app",
  ],
  "research-papers-literature-notes": [
    "research paper highlighter",
    "literature review PDF tool",
    "annotate research papers",
    "academic PDF notes",
  ],
  "professionals-work-documents": [
    "professional PDF workspace",
    "annotate work documents",
    "work PDF library app",
  ],
  "teachers-lesson-materials": [
    "teacher resources for preparing lesson notes",
    "teacher lesson plan PDFs",
    "preparing lesson notes app",
    "educator PDF library",
    "tutor handout organizer",
    "share lesson materials with students",
  ],
  "privacy-private-study-library": [
    "private PDF library",
    "secure study notes app",
    "private study workspace",
  ],
  "shelf-vs-generic-chatbots": [
    "AI grounded in your notes",
    "chat with your PDFs vs ChatGPT",
    "study AI from uploads only",
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
    "language study PDF app",
  ],
  "nonfiction-book-notes": [
    "book notes PDF app",
    "nonfiction reading highlights",
    "annotate ebooks for learning",
  ],
  "search-your-entire-library": [
    "search PDF library",
    "find notes across collections",
  ],
  "study-ai-planner-quiz-actions": [
    "AI study planner",
    "quiz from chat",
    "study AI reminders",
    "create task from Study AI",
  ],
  "study-ai-chat-controls": [
    "stop AI streaming",
    "queue study AI messages",
    "study AI diagram preview",
  ],
};

export const HOME_TITLE =
  "Shelf (myshelflib) — Personal Study Library | PDFs, Study AI & Planner";

export const HOME_DESCRIPTION =
  "Shelf — also called My Shelf Lib / myshelflib — is a personal study library: upload PDFs and YouTube lectures, highlight as you read, ask Study AI from your notes, Share Shelf with classmates, and plan on one calendar.";

/** Homepage meta keywords — brand discovery (incl. misspellings) + product. */
export const HOME_PAGE_KEYWORDS: string[] = [
  ...BRAND_KEYWORDS,
  ...DEFAULT_KEYWORDS,
  "share shelf",
  "chat with PDF",
  "YouTube lecture notes",
  "Telegram PDF import and send",
  "exam quiz from notes",
  "study planner app",
  "teacher resources for lesson notes",
];

export const FEATURES_HUB_TITLE =
  "Shelf Features — PDF Library, YouTube Lectures, Study AI, Quiz & More";

export const FEATURES_HUB_DESCRIPTION =
  "Explore every Shelf feature: personal PDF library, Share Shelf, YouTube lectures, highlights, Study AI, exam quizzes, Telegram, Spotify, teacher lesson prep, planner, and offline PWA.";

export const FEATURES_HUB_KEYWORDS = [
  "Shelf features",
  "personal study library",
  "share shelf",
  "chat with PDF",
  "PDF reader with highlights",
  "Study AI features",
  "exam quiz from notes",
  "study planner app",
  "YouTube lecture notes",
  "Telegram PDF import",
  "teacher lesson resources",
  "offline study app",
];

export const LEARN_DESCRIPTION =
  "Browse free curriculum packs for GATE, UPSC, State PCS, Judiciary, CA, and NEET PG — official PDFs, previous papers, bare acts, and open textbooks. Open without signing up; sign in for highlights and a private library.";

export const BLOG_INDEX_DESCRIPTION =
  "Long-form guides to Shelf: personal PDF libraries, YouTube lectures, highlights, Study AI, Share Shelf, planner, reader workspace, and workflows for students, teachers, researchers, and professionals.";

export const QUIZ_TITLE =
  "Exam-Style Quiz from Your Notes — MCQ, Written & PYQ Practice | Shelf";

export const QUIZ_DESCRIPTION =
  "Sit exam-style MCQs, written answers, and photo working from your Shelf library, uploads, or PYQ-style banks. Proctored or practice sittings, then a per-quiz analysis board.";

export const QUIZ_KEYWORDS = [
  "exam quiz app",
  "MCQ from PDF",
  "PYQ practice quiz",
  "written answer quiz",
  "exam-style quiz from notes",
  "syllabus mapped quiz",
  "UPSC MCQ practice",
  "GATE numerical quiz",
  "study quiz from PDFs",
  "photo of working quiz",
];
