import { buildPost } from "../types";

export const examStyleQuiz = buildPost(
  {
    slug: "exam-style-quiz-from-your-notes",
    title: "Exam-Style Quizzes from Your Library, Uploads, and PYQ Banks",
    description:
      "Choose a proctored or practice quiz on Shelf: MCQ, written, and photo papers from your library, uploads, or PYQ banks, plus a per-quiz analysis board.",
    excerpt:
      "Quiz is a first-class Shelf workspace. Generate exam-level papers, pick a proctored fullscreen sitting or practice mode, then review score, accuracy, topics, and every question on the analysis board.",
    publishedAt: "2026-08-26",
    updatedAt: "2026-08-29",
    tags: ["quiz", "exam practice", "MCQ", "study ai", "PYQ"],
    readingMinutes: 6,
  },
  [
    {
      heading: "One quiz surface, everywhere you study",
      paragraphs: [
        "Open Quiz from the header, press g then q, or type /quiz in Study AI or the reader panel. The same setup and paper chrome opens with the current collection, topic, or document already in scope — so a quiz started from a PDF is the same experience as one started from the Quiz page.",
        "Set difficulty (easy through full exam), an optional timer, how many MCQs, how many written items, and whether the sitting is proctored or practice. Written questions accept a typed answer (LaTeX welcome) and an optional photo of handwritten working; diagram-heavy items ask you to upload the answer image first.",
      ],
    },
    {
      heading: "Three ways to choose the paper",
      paragraphs: [
        "Library scope quizzes a single document, a topic, a collection, or everything you have indexed. Upload mode takes a personal PDF or pasted notes plus an optional syllabus / relevancy doc — the same syllabus files Study AI already uses. Exam bank mode looks for previous-year and standard papers in your library, preloaded curriculum for your study goal, and official syllabus headings when a relevancy doc is attached.",
      ],
      bullets: [
        "Library — document, topic, collection, or whole library",
        "Upload — your file or paste, plus optional syllabus",
        "Exam bank — PYQ-style, standard questions, preloaded packs",
      ],
    },
    {
      heading: "Exam-level stems, not trivia",
      paragraphs: [
        "Questions follow your study goal (UPSC, State PCS, Judiciary, CA, NEET PG, GATE, or general). When a syllabus is attached, every item names the heading it maps to. Without a syllabus, the paper stays on what is relevant in the retrieved notes. Past-paper years are never invented: items are tagged Practice, Standard, or PYQ-style when the year is not in your files.",
        "MCQs use four options and real traps. Numerical and scientific stems use KaTeX. After you submit, MCQs mark instantly and written or image answers are scored against a marking scheme with short examiner feedback.",
      ],
    },
    {
      heading: "How to start",
      paragraphs: [
        "From Library or a reader tab, open Study AI and type /quiz (optionally with a topic). From anywhere signed-in, go to Quiz in the header — New quiz to generate a paper, Past quizzes to open a previous attempt’s analysis board. Search (⌘K) also offers Start a quiz.",
      ],
    },
    {
      heading: "What a sitting feels like",
      paragraphs: [
        "Choose proctored or practice before you generate. A proctored paper opens in fullscreen with the question in the center. Switching browser tabs or apps, or leaving fullscreen, ends the quiz and submits whatever you have answered — the same as the timer hitting zero. Practice sittings use the same centered paper inside the app; tab switches are allowed.",
        "The paper is one question at a time with a navigator for skipped items. A countdown (if you set one) submits when it hits zero. After submit you land on a per-quiz analysis board: score and band, accuracy, correct / incorrect / skipped, time taken versus allotted, breakdown by question type and syllabus heading, then a full question review.",
        "Mathematical and non-mathematical stems share the same chrome: KaTeX in the question, typed $...$ in your answer, or a photo of the derivation. That is the point of a dedicated quiz — not a chat dump of five questions with answers listed underneath.",
      ],
    },
    {
      heading: "Study goal, syllabus, and honesty about PYQs",
      paragraphs: [
        "Your Settings study goal steers the paper setter: UPSC Prelims traps vs Mains demand, ICAI working notes, GATE NAT-style numericals, NEET PG clinical stems, judiciary ingredients questions. Attach a syllabus relevancy doc and every item names the heading. If a real paper year is not in your uploads, the item is tagged Practice or PYQ-style — Shelf will not invent “Prelims 2019 Q12”.",
      ],
    },
  ]
);
