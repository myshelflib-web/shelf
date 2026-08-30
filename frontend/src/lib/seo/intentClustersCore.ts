/** Intent cluster data — public/indexable paths only (no /my-content). */

export type IntentCluster = {
  id: string;
  label: string;
  answer: string;
  queries: string[];
  path: string;
};

export const INTENT_CLUSTERS_CORE: IntentCluster[] = [
  {
    id: "personal-library",
    label: "Organize PDFs into a personal study library",
    answer:
      "Shelf is a personal study library: upload PDFs into collections and topics, keep notes and YouTube lectures beside them, and study in a private workspace at /my-content.",
    queries: [
      "personal study library",
      "organize PDF notes",
      "PDF library for students",
      "digital study notebook",
      "organize coaching PDFs",
    ],
    path: "/features/personal-library",
  },
  {
    id: "pdf-highlights",
    label: "Highlight and annotate PDFs while studying",
    answer:
      "Highlight and annotate PDFs in Shelf’s reader. Color marks stay on the page for revision, and you can ask Study AI from any selection.",
    queries: [
      "PDF reader with highlights",
      "annotate PDF online for study",
      "highlight PDF for revision",
      "PDF annotation app students",
    ],
    path: "/features/pdf-highlights",
  },
  {
    id: "reader-workspace",
    label: "Multi-tab and split-screen PDF study",
    answer:
      "Open multiple PDFs in tabs, split two sources side by side, and resize library and Study AI panels — a full reader workspace for serious revision.",
    queries: [
      "split screen PDF reader",
      "multi tab PDF reader",
      "compare PDF notes side by side",
      "PDF study workspace",
    ],
    path: "/features/reader-workspace",
  },
  {
    id: "library-search",
    label: "Search across your entire PDF library",
    answer:
      "Search titles and content across every collection in Shelf so a half-remembered definition in last month’s PDF is one query away.",
    queries: [
      "search PDF library",
      "find notes across PDFs",
      "full text search study notes",
    ],
    path: "/features/library-search",
  },
  {
    id: "sketch-notes",
    label: "Sketch diagrams and typed notes beside PDFs",
    answer:
      "Add sketch canvases and typed doc pages in the same collections as your PDFs — diagrams, formulas, and revision notes without a separate app.",
    queries: [
      "digital notebook for students",
      "sketch notes beside PDF",
      "typed notes with PDF",
      "diagram notebook app",
    ],
    path: "/features/sketch-notes",
  },
  {
    id: "continue-reading",
    label: "Resume reading where you left off",
    answer:
      "Pin collections and continue reading from your last page. Progress syncs across devices when you are signed in.",
    queries: [
      "continue reading PDF",
      "resume PDF study",
      "pin study collections",
      "reading progress tracker",
    ],
    path: "/features/pin-continue-reading",
  },
  {
    id: "youtube-lectures",
    label: "Watch YouTube lectures next to your notes",
    answer:
      "Paste a YouTube video or playlist into Shelf. Watch lectures beside PDFs, stamp timestamps into notes, and resume playback like reading progress.",
    queries: [
      "YouTube lecture notes",
      "watch YouTube while taking notes",
      "import YouTube playlist study",
      "YouTube coaching notes app",
    ],
    path: "/features/youtube-lectures",
  },
  {
    id: "study-ai",
    label: "Chat with your PDFs using Study AI",
    answer:
      "Study AI answers from your uploaded PDFs and notes — not the open web — with cited excerpts for exam prep, research, and coursework.",
    queries: [
      "chat with PDF",
      "AI study assistant",
      "ask AI from PDF notes",
      "AI tutor from my notes",
      "PDF question answering",
    ],
    path: "/features/study-ai",
  },
  {
    id: "study-ai-page",
    label: "Ask AI on a PDF page or highlight",
    answer:
      "Select a passage or open Ask on a page to get explanations, summaries, and exam-style follow-ups grounded in that document.",
    queries: [
      "ask AI on PDF highlight",
      "explain this paragraph AI",
      "PDF page AI assistant",
    ],
    path: "/features/study-ai-page-ask",
  },
  {
    id: "study-ai-library",
    label: "Ask AI across your whole library",
    answer:
      "Chat across your entire Shelf library, one collection, or a single topic with multi-turn threads and optional syllabus docs.",
    queries: [
      "AI library search",
      "cross document AI chat",
      "ask AI across PDFs",
      "syllabus aware AI tutor",
    ],
    path: "/features/study-ai-library-chat",
  },
  {
    id: "mind-maps",
    label: "AI summaries and mind maps from PDFs",
    answer:
      "Generate summaries and mind maps from your own PDFs so revision stays grounded in what you uploaded.",
    queries: [
      "mind map from PDF",
      "AI summary notes",
      "PDF to mind map",
      "summarize PDF for study",
    ],
    path: "/features/study-ai-summaries",
  },
  {
    id: "vs-chatbots",
    label: "AI grounded in your notes (not generic ChatGPT)",
    answer:
      "Unlike generic chatbots, Shelf Study AI retrieves from your library so answers stay tied to your coaching notes, textbooks, and highlights.",
    queries: [
      "AI grounded in your notes",
      "chat with your PDFs vs ChatGPT",
      "study AI from uploads only",
    ],
    path: "/blog/shelf-vs-generic-chatbots",
  },
  {
    id: "exam-quiz",
    label: "Exam-style quiz from your notes",
    answer:
      "Generate MCQs, written answers, and photo-of-working quizzes from your library or uploads — practice or proctored sittings with analysis.",
    queries: [
      "exam quiz from notes",
      "MCQ from PDF",
      "PYQ practice quiz",
      "exam-style quiz app",
      "written answer quiz",
    ],
    path: "/quiz",
  },
  {
    id: "planner",
    label: "Study planner and revision calendar",
    answer:
      "Plan tasks and events on a week/month board, link work to library pages, and keep revision schedules next to your PDFs.",
    queries: [
      "study planner app",
      "revision calendar for students",
      "study schedule app",
      "exam revision planner",
    ],
    path: "/features/planner-calendar",
  },
  {
    id: "streak",
    label: "Study streak and reading dashboard",
    answer:
      "Track reading minutes, streaks, and achievements so daily study habits stay visible without a separate habit app.",
    queries: [
      "study streak app",
      "reading tracker students",
      "study habit dashboard",
    ],
    path: "/features/dashboard-streak",
  },
  {
    id: "streak-share",
    label: "Share study streak cards",
    answer:
      "Share streak cards for Instagram or WhatsApp from Shelf — accountability for exam prep without exposing your private library.",
    queries: [
      "study streak share",
      "study progress instagram",
      "reading streak card",
    ],
    path: "/features/study-streak-share-cards",
  },
  {
    id: "share-shelf",
    label: "Share Shelf documents with classmates",
    answer:
      "Share Shelf PDFs and notebooks with view or edit access. Recipients see Shared with me; you can save a copy or send the file to Telegram.",
    queries: [
      "share shelf",
      "share Shelf documents",
      "share PDF with classmates",
      "collaborative study documents",
      "share notes with class",
    ],
    path: "/features/document-sharing",
  },
  {
    id: "telegram",
    label: "Import and send study PDFs via Telegram",
    answer:
      "Forward PDFs from Telegram to Shelf, study them with highlights and AI, then send library PDFs back to your Telegram chat.",
    queries: [
      "save Telegram PDF to library",
      "Telegram study notes import",
      "send PDF to Telegram",
      "forward PDF to study app",
    ],
    path: "/features/telegram-pdf-import",
  },
  {
    id: "spotify",
    label: "Spotify focus audio while reading",
    answer:
      "Play Spotify tracks, playlists, or podcasts beside your PDF. Audio keeps playing when you hide the panel or go fullscreen.",
    queries: [
      "Spotify study app",
      "focus music while studying",
      "read PDF with music",
    ],
    path: "/features/spotify-focus-audio",
  },
];
