/**
 * SEO keywords for Shelf — multi-audience personal study library.
 * Exam prep is one audience among many (students, professionals, researchers).
 */
import { BRAND_KEYWORDS } from "./brandIdentity";

export const SEO_KEYWORDS = {
  product: [
    "personal study library",
    "all in one study workspace",
    "store notes and PDFs",
    "ask LLM about PDFs",
    "student study tool",
    "PDF reader with highlights",
    "research paper writing app",
    "APA MLA citation tool",
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
    "student study tool",
    "teacher tool for preparing tests",
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
    "ask LLM about my notes",
    "student ask question to LLM",
    "store all my notes and PDFs",
    "LLM grounded in my library",
    "Notion NotebookLM Obsidian alternative",
    "teacher quiz maker from notes",
    "homework help from my notes",
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
  "chat with PDF",
  "AI tutor for students",
  "AI PDF summarizer",
  "all in one study workspace",
  "NotebookLM alternatives",
  "best study apps for students",
  "free AI study tools",
  "student study tool",
  "Study AI",
  "ask LLM about PDFs",
  "AI flashcards from PDF",
  "teacher tool for preparing tests",
  "personal study library",
  "Quizlet alternative",
  "study planner app",
  "exam quiz",
  "Obsidian alternative students",
  "affordable AI study app India",
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
    "ask LLM about PDFs",
  ],
  "study-ai-library-wide-chat": [
    "AI library search",
    "PDF question answering",
    "cross document AI chat",
    "ask LLM across notes",
  ],
  "store-notes-pdfs-ask-llm": [
    "store notes and PDFs",
    "ask LLM about my notes",
    "PDF notes library with AI",
    "LLM grounded in uploads",
  ],
  "shelf-vs-notebooklm": [
    "NotebookLM alternative",
    "Shelf vs NotebookLM",
    "ask AI about PDFs",
  ],
  "shelf-vs-chatpdf": [
    "ChatPDF alternative",
    "Shelf vs ChatPDF",
    "chat with multiple PDFs",
  ],
  "shelf-vs-notion-ai": [
    "Notion AI alternative for PDFs",
    "Shelf vs Notion AI",
    "PDF library with LLM",
  ],
  "shelf-vs-obsidian": [
    "Obsidian alternative for students",
    "Shelf vs Obsidian",
    "notes app with PDF AI",
  ],
  "all-in-one-study-workspace": [
    "all in one study app",
    "Notion NotebookLM Obsidian alternative",
    "unified study workspace",
  ],
  "teacher-tool-prepare-tests": [
    "teacher tool for preparing tests",
    "teacher quiz maker from notes",
    "create quiz from lesson PDF",
  ],
  "student-study-tool-ask-llm": [
    "student study tool",
    "student ask question to LLM",
    "AI tutor for my notes",
  ],
  "shelf-vs-alternatives-features-pricing": [
    "Shelf vs alternatives",
    "best study app pricing India",
    "NotebookLM Notion Obsidian comparison",
    "affordable AI study app",
  ],
  "study-ai-stop-queue-diagrams": [
    "stop AI generation",
    "queue chat messages",
    "mermaid diagram preview",
    "Google search study AI",
  ],
  "pin-study-ai-chats": [
    "pin AI chat",
    "favorite study conversation",
    "Study AI sidebar",
    "save chat thread",
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
  "research-doc-writing-suite": [
    "research paper writing app",
    "citation manager with PDF library",
    "APA MLA citation tool students",
    "export notes to LaTeX",
    "IMRaD paper template",
    "BibTeX import study app",
  ],
  "paraphrase-and-library-originality": [
    "paraphrase PDF selection",
    "library originality check",
    "plagiarism check own notes",
    "rewrite study notes AI",
    "web plagiarism checker students",
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
    "ask LLM vs ChatGPT for notes",
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
  "Chat with PDF, AI Tutor & Study Apps — All-in-One Workspace | Shelf";

export const HOME_DESCRIPTION =
  "Shelf is a free AI study workspace: chat with PDF, AI tutor from your notes, summaries and mind maps, flashcards and quizzes, Docs, and a planner — all in one app (myshelflib).";

/** Homepage meta keywords — brand discovery (incl. misspellings) + product. */
export const HOME_PAGE_KEYWORDS: string[] = [
  ...BRAND_KEYWORDS,
  ...DEFAULT_KEYWORDS,
  "chat with PDF AI free",
  "NotebookLM alternatives",
  "AI flashcards from PDF",
  "best study apps 2026",
  "free AI for students",
  "student ask question to LLM",
  "teacher tool for preparing tests",
  "store all my notes and PDFs",
  "GoodNotes alternative web",
  "RemNote alternative",
];

export const FEATURES_HUB_TITLE =
  "Shelf Features — All-in-One Study Tool for Students & Teachers";

export const FEATURES_HUB_DESCRIPTION =
  "Explore Shelf’s all-in-one study workspace: PDF library, Docs, Study AI (LLM), teacher test prep, student quizzes, Share Shelf, YouTube, planner, and offline PWA.";

export const FEATURES_HUB_KEYWORDS = [
  "Shelf features",
  "all in one study workspace",
  "student study tool",
  "teacher tool for preparing tests",
  "store notes and PDFs",
  "ask LLM about PDFs",
  "personal study library",
  "share shelf",
  "chat with PDF",
  "Study AI features",
  "exam quiz from notes",
  "study planner app",
  "YouTube lecture notes",
  "offline study app",
];

export const LEARN_DESCRIPTION =
  "Browse free curriculum packs for GATE, UPSC, State PCS, Judiciary, CA, and NEET PG — official PDFs, previous papers, bare acts, and open textbooks. Open without signing up; sign in for highlights and a private library.";

export const BLOG_INDEX_DESCRIPTION =
  "High-traffic guides: NotebookLM alternatives, chat with PDF, AI tutor, PDF summarizer, flashcards, free AI study tools, best study apps, RemNote/Quizlet alternatives, and Shelf vs competitors.";

export const QUIZ_TITLE =
  "Teacher & Student Quizzes from Your Notes — MCQ, Written & PYQ | Shelf";

export const QUIZ_DESCRIPTION =
  "Prepare tests or practice as a student: exam-style MCQs, written answers, and photo working from Shelf library notes. Teachers generate papers from lesson PDFs; students revise with analysis.";

export const QUIZ_KEYWORDS = [
  "exam quiz app",
  "teacher tool for preparing tests",
  "teacher quiz maker from notes",
  "MCQ from PDF",
  "student study quiz",
  "PYQ practice quiz",
  "written answer quiz",
  "exam-style quiz from notes",
  "create quiz from lesson PDF",
  "study quiz from PDFs",
];
