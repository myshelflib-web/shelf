import type { BlogSection } from "../types";

export const BLOG_EXPANSIONS_C: Record<string, BlogSection[]> = {
  "study-ai-planner-quiz-actions": [
    {
      heading: "What Study AI can create",
      paragraphs: [
        "Chat tools can add planner tasks and events, set reminders with due times, and kick off quiz generation without leaving the conversation. Confirmations come back in the thread with links to /planner or /quiz/:id.",
        "If a request is ambiguous, Study AI asks a short follow-up before writing to your account so you do not get surprise calendar spam.",
      ],
    },
    {
      heading: "Reader panel vs full Study AI",
      paragraphs: [
        "The document Ask panel is ideal when the open PDF is the focus but you still want a quick reminder or quiz on that page. Full /study-ai is better for library-wide scope, multi-turn planning, and longer action chains.",
        "Both surfaces share the same tools and quotas, so actions you start in the reader show up in the same planner and quiz lists.",
      ],
    },
    {
      heading: "Safety and undo",
      paragraphs: [
        "Destructive deletes are limited; Study AI prefers create and update. You can edit or delete planner items on /planner and abandon quizzes from the Quiz workspace if a draft is wrong.",
        "Actions use your signed-in account only. Shared pages do not let collaborators trigger planner writes on the owner’s calendar through Ask.",
      ],
    },
    {
      heading: "When retrieval still matters",
      paragraphs: [
        "Even for general questions, Study AI searches your library when it helps. Action requests like “quiz me on this chapter” still use the page or collection you named so questions stay on syllabus.",
        "Thin or scanned PDFs rely on OCR text and the visible page snapshot the same way regular Ask does.",
      ],
    },
    {
      heading: "Plans and limits",
      paragraphs: [
        "Quiz generation and chat both draw from your Study AI token allowance. Free and Premium caps are unchanged — actions do not unlock a separate pool.",
        "If you hit the monthly limit mid-action, the chat explains the block and points you to upgrade or wait for the reset window.",
      ],
    },
    {
      heading: "Example prompts",
      paragraphs: [
        "Try “remind me to revise Article 14 tomorrow evening,” “add an unscheduled task to outline this judgment,” or “create a hard 10-question MCQ quiz on this PDF.”",
        "Combine intent with scope: “quiz on my Polity collection, medium difficulty” from library chat, or “schedule reading this page for Saturday morning” from the reader.",
      ],
    },
  ],
  "study-ai-depth-modes": [
    {
      heading: "Standard vs Quick in practice",
      paragraphs: [
        "Quick mode is still the default for everyday questions — define a term, check a formula, or queue a follow-up while a reply streams. Standard is the sweet spot when you want a complete explanation with tables and a recap without waiting for a full-book pass.",
        "Switch depth before you send; it applies to that message only in the thread (your choice is remembered for the next question). Slash commands like /explain and /compare respect the depth you picked.",
      ],
    },
    {
      heading: "Deep mode and Premium",
      paragraphs: [
        "Deep requires Premium because it runs more model calls and a higher output token ceiling. Free users can still use Standard for noticeably longer answers than Quick.",
        "Token usage scales with depth — a Deep map-reduce summary on a long textbook may consume several times a Quick reply. Check Settings for your monthly Study AI allowance.",
      ],
    },
    {
      heading: "Slash commands for long outputs",
      paragraphs: [
        "/deep-summary on an open page triggers chapter-wise synthesis when the file is long. /chapter-notes, /analyze, and /mains expand into long-form prompts tuned for revision and exam tracks.",
        "Combine depth with scope: library chat with Standard can pull across a collection; reader Deep focuses on the indexed chunks of the open PDF.",
      ],
      bullets: [
        "/deep-summary — full document, section by section",
        "/chapter-notes — one heading per chapter",
        "/mains — long-form answer skeleton",
        "/analyze — themes, evidence, gaps",
      ],
    },
    {
      heading: "What Deep does not replace",
      paragraphs: [
        "Study AI still grounds answers in indexed text. Scanned PDFs without OCR remain thin until processing finishes. Deep reads more of what is indexed — it does not invent pages you never uploaded.",
        "For the hardest judgment or proof work, pair Deep summaries with your own highlights and planner sessions. The depth toggle makes answers longer and more structured; you still choose what to memorize.",
      ],
    },
  ],
};
