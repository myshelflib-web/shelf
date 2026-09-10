import type { IntentCluster } from "./intentClustersCore";

/**
 * Broad “study tool” intents — teachers, students, LLM Q&A,
 * and all-in-one workspace positioning (Notion + NotebookLM + Obsidian + Docs).
 */
export const INTENT_CLUSTERS_STUDY_TOOLS: IntentCluster[] = [
  {
    id: "all-in-one-study-workspace",
    label: "All-in-one study workspace (notes, PDFs, LLM, docs)",
    answer:
      "Shelf combines a personal library, typed Docs, sketch notebooks, PDF reader, Study AI (LLM), quizzes, and a planner in one workspace — the Notion + NotebookLM + Obsidian + Docs combo students and teachers search for.",
    queries: [
      "all in one study app",
      "all in one study workspace",
      "Notion NotebookLM Obsidian alternative",
      "study app like Notion and NotebookLM",
      "second brain for students with PDFs",
      "unified study workspace",
      "notes PDF AI quiz planner one app",
      "best study tool for students 2026",
    ],
    path: "/features/all-in-one-study-workspace",
  },
  {
    id: "student-study-tool",
    label: "Student study tool for notes, PDFs, and revision",
    answer:
      "Shelf is a student study tool: organize lecture PDFs and notes, highlight while reading, ask Study AI, sit quizzes from your material, and plan revision on one calendar.",
    queries: [
      "student study tool",
      "study tool for students",
      "best app for studying PDFs",
      "student notes and PDF organizer",
      "study app for college students",
      "online study workspace for students",
      "revision tool for students",
      "homework study assistant app",
    ],
    path: "/blog/student-study-tool-ask-llm",
  },
  {
    id: "student-ask-llm",
    label: "Students ask an LLM questions about their notes",
    answer:
      "Students ask Study AI — Shelf’s LLM — questions about their own PDFs and notes. Answers stay grounded in uploads with citations, not generic web guesses.",
    queries: [
      "student ask question to LLM",
      "ask LLM about my study notes",
      "AI tutor for my notes",
      "student AI question answering",
      "ask AI homework from my PDFs",
      "LLM study assistant for students",
      "chat with my class notes AI",
      "explain my textbook with AI",
    ],
    path: "/features/study-ai",
  },
  {
    id: "teacher-prepare-tests",
    label: "Teacher tool for preparing tests and quizzes",
    answer:
      "Teachers and tutors prepare tests on Shelf: organize syllabus PDFs, generate exam-style MCQs and written items from notes, share handouts, and keep prep private to their account.",
    queries: [
      "teacher tool for preparing tests",
      "teacher quiz maker from notes",
      "prepare MCQ tests for class",
      "teacher test preparation app",
      "create quiz from lesson PDF",
      "tutor exam paper generator",
      "teacher assessment tool PDFs",
      "make practice tests for students",
    ],
    path: "/features/teacher-test-prep",
  },
  {
    id: "teacher-study-materials",
    label: "Teacher tool for lesson materials and handouts",
    answer:
      "Teachers store lesson plan PDFs, worksheets, and answer keys in Shelf, annotate prep notes, share handouts via Share Shelf, and use Study AI for differentiation ideas.",
    queries: [
      "teacher tool for lesson plans",
      "teacher resources app",
      "educator PDF organizer",
      "tutor materials library",
      "prepare lesson notes digitally",
      "share handouts with students app",
    ],
    path: "/blog/teachers-lesson-materials",
  },
  {
    id: "obsidian-alternative-study",
    label: "Obsidian-style notes with PDF library and LLM",
    answer:
      "Want linked notes plus PDFs and an LLM? Shelf keeps Docs and sketch notebooks beside your PDF library with Study AI — an Obsidian-style study stack without juggling three apps.",
    queries: [
      "Obsidian alternative for students",
      "Obsidian with PDF and AI",
      "notes app with PDF library AI",
      "second brain PDF study",
      "Shelf vs Obsidian",
    ],
    path: "/blog/shelf-vs-obsidian",
  },
  {
    id: "notion-notebooklm-combo",
    label: "Notion + NotebookLM + Docs in one study app",
    answer:
      "Shelf is built for people who want Notion-style Docs, NotebookLM-style grounded LLM chat, and a real PDF reader with highlights — plus quizzes and a planner — in one product.",
    queries: [
      "Notion and NotebookLM together",
      "alternative to Notion and NotebookLM",
      "Docs and PDF AI study app",
      "workspace for notes PDFs and AI",
      "replace Notion ChatGPT for study",
    ],
    path: "/features/all-in-one-study-workspace",
  },
  {
    id: "exam-prep-study-tool",
    label: "Exam preparation study tool with AI and quizzes",
    answer:
      "Competitive exam and course prep on Shelf: store coaching PDFs, ask Study AI with syllabus framing, sit exam-style quizzes, and schedule revision.",
    queries: [
      "exam preparation study tool",
      "AI exam prep app",
      "study tool for competitive exams",
      "UPSC study tool with AI",
      "GATE revision app with quizzes",
      "exam notes PDF AI quiz",
    ],
    path: "/features/exam-quiz",
  },
  {
    id: "homework-help-own-notes",
    label: "Homework help from your own notes (not generic AI)",
    answer:
      "Ask Study AI using the PDFs and notes you uploaded so homework help cites your class material — better than a generic LLM that never saw your syllabus.",
    queries: [
      "homework help from my notes",
      "AI homework help own textbooks",
      "study AI for class notes",
      "ask AI about lecture slides",
    ],
    path: "/blog/student-study-tool-ask-llm",
  },
  {
    id: "vs-alternatives-pricing",
    label: "Shelf vs alternatives — features and pricing",
    answer:
      "Shelf beats stacked tools on the full study job: library, Docs, grounded LLM, quizzes, and planner — with Free including AI/quiz and Premium from about ₹149/month via UPI. Compare NotebookLM, Notion, Obsidian, and ChatPDF on /features/shelf-vs-alternatives.",
    queries: [
      "best study app features and pricing",
      "Shelf vs alternatives",
      "cheapest AI study app India",
      "NotebookLM vs Notion vs Obsidian for study",
      "affordable ChatPDF alternative",
      "study app free AI and quiz",
      "best value all in one study tool",
    ],
    path: "/features/shelf-vs-alternatives",
  },
];
