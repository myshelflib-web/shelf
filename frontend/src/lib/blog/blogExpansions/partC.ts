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
};
