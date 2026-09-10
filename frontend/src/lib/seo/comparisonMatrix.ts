/**
 * Competitive positioning for SEO landings / blog.
 * Prefer concrete stack value over unverifiable “#1” claims.
 * Do not invent competitor list prices — compare categories of cost.
 */

export type ComparisonRow = {
  capability: string;
  shelf: string;
  typicalAlternatives: string;
};

/** High-level feature matrix used on /features/shelf-vs-alternatives. */
export const FEATURE_COMPARISON_ROWS: ComparisonRow[] = [
  {
    capability: "Personal PDF library + highlights",
    shelf: "Built-in reader, tabs, split view, marks on your uploads",
    typicalAlternatives: "Drive folder, ChatPDF one-file, or weak PDF in notes apps",
  },
  {
    capability: "Typed Docs & sketch notebooks",
    shelf: "Beside PDFs in the same collections",
    typicalAlternatives: "Notion/Obsidian notes often separate from PDF study",
  },
  {
    capability: "LLM grounded in your library",
    shelf: "Study AI with RAG, citations, page → library scope",
    typicalAlternatives: "NotebookLM notebooks or paste-into-ChatGPT",
  },
  {
    capability: "Exam-style quizzes from your notes",
    shelf: "MCQ, written, photo working; teacher or student",
    typicalAlternatives: "Separate quiz sites or generic AI question lists",
  },
  {
    capability: "Revision planner + streaks",
    shelf: "Tasks linked to library pages",
    typicalAlternatives: "Calendar app disconnected from PDFs",
  },
  {
    capability: "Share handouts / class PDFs",
    shelf: "Share Shelf + optional Telegram send",
    typicalAlternatives: "Chat attachments or public links without study tools",
  },
  {
    capability: "Free plan that includes AI + quiz",
    shelf: "Free library, Study AI limits, quiz, planner",
    typicalAlternatives: "Often pay separately for AI, storage, or quiz tools",
  },
];

export const PRICING_VALUE_POINTS = [
  "Free forever for core study: library, highlights, Study AI (monthly limits), quiz, planner, Learn curriculum",
  "Premium from about ₹149/month or ₹1299/year (UPI Autopay) — one subscription instead of stacking notes + AI + quiz apps",
  "India-first checkout (Razorpay), coupons, and affiliate coins — transparent quotas (100 MB → 1 GB, 50k → 1M AI tokens)",
] as const;

export const ALTERNATIVE_TOOLS = [
  {
    name: "NotebookLM",
    fit: "Great for chatting with a source notebook",
    shelfEdge: "Shelf adds durable library, highlights, quizzes, planner, Docs",
  },
  {
    name: "ChatPDF / chat-with-PDF tools",
    fit: "Fast Q&A on one file",
    shelfEdge: "Shelf scopes AI across your whole notes + PDF library",
  },
  {
    name: "Notion + Notion AI",
    fit: "Wikis, docs, team workspace",
    shelfEdge: "Shelf is PDF-first study with grounded Study AI and exam quizzes",
  },
  {
    name: "Obsidian (+ AI plugins)",
    fit: "Linked Markdown second brain",
    shelfEdge: "Shelf ships reader, RAG, quiz, and planner without plugin glue",
  },
  {
    name: "ChatGPT / generic LLMs",
    fit: "Brainstorming and open-web answers",
    shelfEdge: "Study AI cites your uploads — better for exams and homework accuracy",
  },
  {
    name: "RemNote / Quizlet / Anki",
    fit: "Flashcards and spaced repetition first",
    shelfEdge: "Shelf generates quizzes/flashcards from the same PDF library + AI tutor",
  },
  {
    name: "GoodNotes / Notability",
    fit: "iPad handwriting and lecture markup",
    shelfEdge: "Shelf is the web library + AI + quiz layer across devices",
  },
] as const;
