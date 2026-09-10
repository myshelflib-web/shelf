import { longPost } from "../../longPost";

export const aiFlashcardsQuizzesFromPdf = longPost(
  {
    slug: "ai-flashcards-quizzes-from-pdf",
    title: "AI Flashcards & Quizzes from PDF Notes (Quizlet Alternative)",
    description:
      "Generate AI flashcards and exam-style quizzes from PDF notes on Shelf — a Quizlet/Anki-style practice loop grounded in your textbooks, plus Study AI chat.",
    excerpt:
      "Turn the same PDF you chat with into flashcards and MCQ papers — active recall without retyping cards by hand.",
    publishedAt: "2026-09-11",
    tags: ["flashcards", "quiz", "Quizlet", "Anki", "PDF", "Study AI"],
  },
  [
    {
      heading: "Active recall beats rereading",
      paragraphs: [
        "Flashcards and quizzes force retrieval. AI helps generate them quickly — quality depends on whether cards come from your real notes.",
      ],
    },
    {
      heading: "Flashcards from Study AI",
      paragraphs: [
        "Ask Study AI for flashcards on a page or thread, then download or save them into your library workflow.",
      ],
    },
    {
      heading: "Exam-style quizzes",
      paragraphs: [
        "Shelf Quiz builds MCQ and written papers from library scope or uploads — closer to real exams than casual multiple choice decks.",
      ],
    },
    {
      heading: "Vs Quizlet / Anki / RemNote",
      paragraphs: [
        "Quizlet and Anki excel at deck culture and spaced repetition. Shelf wins when the deck should start from the same PDF library and AI tutor you already use.",
      ],
    },
    {
      heading: "Teachers",
      paragraphs: [
        "The same quiz tools help teachers prepare tests from lesson PDFs without a separate assessment product.",
      ],
    },
    {
      heading: "Try",
      paragraphs: [
        "Open /features/ai-flashcards-quizzes or /quiz after uploading notes.",
      ],
    },
  ]
);
