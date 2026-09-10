import type { IntentCluster } from "./intentClustersCore";

/**
 * High-traffic / trending study + AI search intents.
 * Paths must be public (features or blog) — never /my-content.
 */
export const INTENT_CLUSTERS_TRAFFIC: IntentCluster[] = [
  {
    id: "chat-with-pdf",
    label: "Chat with PDF using AI",
    answer:
      "Shelf Study AI lets you chat with PDFs and notes in your library — ask questions, get cited answers, summarize chapters, and continue across multiple files.",
    queries: [
      "chat with PDF",
      "chat with PDF AI free",
      "ask questions about PDF",
      "PDF chatbot",
      "talk to PDF AI",
      "AI PDF reader chat",
      "converse with PDF",
      "PDF Q&A AI",
    ],
    path: "/features/chat-with-pdf",
  },
  {
    id: "ai-pdf-summarizer",
    label: "AI PDF summarizer for students",
    answer:
      "Summarize PDFs into revision notes and mind maps with Shelf Study AI — grounded in your uploaded chapters, not generic web summaries.",
    queries: [
      "AI PDF summarizer",
      "summarize PDF AI free",
      "PDF summary generator students",
      "chapter summary AI",
      "long PDF summary tool",
      "AI summarize textbook",
      "PDF to notes AI",
      "condense PDF for revision",
    ],
    path: "/features/study-ai-summaries",
  },
  {
    id: "ai-tutor",
    label: "AI tutor from your own study materials",
    answer:
      "Shelf Study AI acts as an AI tutor on your PDFs and notes — explain concepts, walk through problems, and cite the page you uploaded.",
    queries: [
      "AI tutor for students",
      "personal AI tutor free",
      "AI tutor from my notes",
      "AI teaching assistant students",
      "explain concept from textbook AI",
      "AI study buddy",
      "virtual tutor PDF",
      "AI homework tutor own materials",
    ],
    path: "/features/ai-tutor",
  },
  {
    id: "ai-flashcards-quiz",
    label: "AI flashcards and quizzes from PDF notes",
    answer:
      "Turn PDFs and notes into flashcards and exam-style quizzes on Shelf — practice MCQs and written answers grounded in your uploads.",
    queries: [
      "AI flashcards from PDF",
      "generate quiz from PDF",
      "PDF to flashcards AI",
      "Quizlet alternative AI",
      "Anki AI flashcards from notes",
      "make flashcards from textbook",
      "AI quiz generator from notes",
      "study flashcards AI free",
    ],
    path: "/features/ai-flashcards-quizzes",
  },
  {
    id: "notebooklm-alternatives",
    label: "NotebookLM alternatives for students",
    answer:
      "Looking for NotebookLM alternatives? Shelf is a personal study library with grounded Study AI, quizzes, Docs, and a planner — compare on our alternatives guide.",
    queries: [
      "NotebookLM alternatives",
      "NotebookLM alternative for students",
      "best NotebookLM alternatives 2026",
      "NotebookLM alternative with quizzes",
      "Google NotebookLM alternative",
      "NotebookLM vs other study AI",
    ],
    path: "/blog/best-notebooklm-alternatives",
  },
  {
    id: "best-study-apps",
    label: "Best study apps for students",
    answer:
      "Shelf ranks among the best study apps when you need PDFs, notes, AI Q&A, quizzes, and planning in one workspace — not five separate tools.",
    queries: [
      "best study apps for students",
      "best study apps 2026",
      "best apps for studying college",
      "best PDF study apps",
      "best AI study apps",
      "top study tools for students",
      "best revision apps",
    ],
    path: "/blog/best-study-apps-for-students",
  },
  {
    id: "free-ai-study",
    label: "Free AI study tools",
    answer:
      "Shelf’s free plan includes a private library, Study AI with monthly limits, exam-style quiz, and planner — a real free AI study tool, not only a trial.",
    queries: [
      "free AI study tools",
      "free AI for students",
      "free chat with PDF",
      "free AI tutor",
      "free PDF AI summarizer",
      "free AI quiz generator",
      "best free study AI India",
    ],
    path: "/blog/free-ai-study-tools",
  },
  {
    id: "remnote-quizlet-alts",
    label: "RemNote, Quizlet, and Anki alternatives with PDF AI",
    answer:
      "Need RemNote or Quizlet-style practice plus a PDF library and AI tutor? Shelf generates quizzes and flashcards from your notes alongside Study AI.",
    queries: [
      "RemNote alternative",
      "Quizlet alternative",
      "Anki alternative with AI",
      "Knowt alternative",
      "StudyFetch alternative",
      "flashcard app with PDF AI",
    ],
    path: "/blog/remnote-quizlet-anki-alternatives",
  },
  {
    id: "mind-map-pdf",
    label: "Mind map from PDF with AI",
    answer:
      "Generate mind maps and revision diagrams from PDF pages with Shelf Study AI, then keep them next to the source in your library.",
    queries: [
      "mind map from PDF",
      "AI mind map PDF",
      "PDF to mind map free",
      "create mind map from notes AI",
    ],
    path: "/features/study-ai-summaries",
  },
  {
    id: "youtube-lecture-notes-ai",
    label: "YouTube lecture notes and AI study",
    answer:
      "Import YouTube lectures into Shelf, take notes beside the video, and ask Study AI from that page — lecture + PDF + AI in one library.",
    queries: [
      "YouTube lecture notes AI",
      "summarize YouTube lecture AI",
      "study YouTube with notes app",
      "AI notes from YouTube video",
      "watch lecture take notes AI",
    ],
    path: "/features/youtube-lectures",
  },
  {
    id: "goodnotes-web-alt",
    label: "GoodNotes / Notability alternative on the web",
    answer:
      "Shelf offers sketch notebooks and PDF highlights in a web study workspace — a GoodNotes-style markup flow plus Study AI, quizzes, and cloud library.",
    queries: [
      "GoodNotes alternative web",
      "Notability alternative online",
      "PDF annotation app like GoodNotes",
      "digital notebook web students",
      "handwriting notes with PDF AI",
    ],
    path: "/blog/goodnotes-notability-alternative",
  },
  {
    id: "research-ai-papers",
    label: "AI for research papers and literature notes",
    answer:
      "Researchers highlight papers, write Docs with citations, and ask Study AI across a private corpus — literature notes without losing PDF context.",
    queries: [
      "AI for research papers",
      "literature review AI tool",
      "chat with research PDF",
      "Zotero alternative with AI",
      "academic PDF AI assistant",
    ],
    path: "/blog/research-papers-literature-notes",
  },
  {
    id: "study-planner-ai",
    label: "AI study planner and revision schedule",
    answer:
      "Shelf pairs a revision calendar with Study AI actions — create tasks from chat and link them to the PDFs you need to reopen.",
    queries: [
      "AI study planner",
      "revision timetable app",
      "study schedule AI",
      "exam revision planner AI",
      "study calendar with PDF links",
    ],
    path: "/features/planner-calendar",
  },
  {
    id: "paraphrase-notes-ai",
    label: "Paraphrase and rewrite study notes with AI",
    answer:
      "Paraphrase PDF or Doc selections with Shelf Study AI and check originality against your library — rewrite notes without losing source context.",
    queries: [
      "paraphrase tool for students",
      "AI rewrite study notes",
      "paraphrase PDF selection",
      "reword notes AI free",
    ],
    path: "/features/writing-assist-originality",
  },
];
