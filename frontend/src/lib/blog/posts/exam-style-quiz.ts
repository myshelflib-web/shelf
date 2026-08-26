import { buildPost } from "../types";

export const examStyleQuiz = buildPost(
  {
    slug: "exam-style-quiz-from-your-notes",
    title: "Exam-Style Quizzes from Your Library, Uploads, and PYQ Banks",
    description:
      "Sit MCQ, written, and photo-answer quizzes on Shelf: scoped to a document or collection, an uploaded syllabus, or preloaded PYQ-style papers at your exam track.",
    excerpt:
      "Quiz is a first-class Shelf workspace. Generate exam-level papers from a page, topic, or collection; upload notes plus a syllabus; or drill PYQs and standard questions. Timed MCQs, typed answers, and photos of working — with math.",
    publishedAt: "2026-08-26",
    tags: ["quiz", "exam practice", "MCQ", "study ai", "PYQ"],
    readingMinutes: 6,
  },
  [
    {
      heading: "One quiz surface, everywhere you study",
      paragraphs: [
        "Open Quiz from the header, press g then q, or type /quiz in Study AI or the reader panel. The same setup and paper chrome opens with the current collection, topic, or document already in scope — so a quiz started from a PDF is the same experience as one started from the Quiz page.",
        "Set difficulty (easy through full exam), an optional timer, how many MCQs, and how many written items. Written questions accept a typed answer (LaTeX welcome) and an optional photo of handwritten working; diagram-heavy items ask you to upload the answer image first.",
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
        "From Library or a reader tab, open Study AI and type /quiz (optionally with a topic). From anywhere signed-in, go to Quiz in the header and pick Library, Upload, or Exam bank. Search (⌘K) also offers Start a quiz. Papers stay in Recent so you can resume or review a graded attempt.",
      ],
    },
    {
      heading: "What a sitting feels like",
      paragraphs: [
        "The paper is one question at a time with a navigator for skipped items. A countdown (if you set one) submits when it hits zero. After submit, MCQs show the key and why traps fail; written and photo answers return a mark fraction plus examiner notes against the scheme. You can walk the whole paper again in review without regenerating it.",
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
