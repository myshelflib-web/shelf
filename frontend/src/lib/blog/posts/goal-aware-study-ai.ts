import { buildPost } from "../types";

export const goalAwareStudyAi = buildPost(
  {
    slug: "goal-aware-study-ai",
    title: "Goal-Aware Study AI for UPSC, Judiciary, NEET PG, and More",
    description:
      "Set your study goal on Shelf so Study AI tailors answers to UPSC, State PCS, Judiciary, CA, NEET PG, or GATE — with structured Markdown outputs.",
    excerpt:
      "One study goal setting steers prompts across reader Ask AI and full Study AI chat so answers match the exam you are actually preparing for.",
    publishedAt: "2026-02-21",
    updatedAt: "2026-08-26",
    tags: ["study ai", "study goal", "upsc", "exams"],
    readingMinutes: 5,
  },
  [
    {
      heading: "Why generic AI fails exams",
      paragraphs: [
        "A general chatbot answers like a textbook. Judiciary answers need case citations and procedural clarity; UPSC answers need analytical structure; NEET PG wants clinical precision. Shelf injects your chosen study goal into the system prompt so tone and emphasis shift automatically.",
      ],
    },
    {
      heading: "Available tracks",
      paragraphs: [
        "Choose General or a specific track in Settings: UPSC, State PCS, Judiciary, CA, NEET PG, or GATE. The setting applies account-wide to new Study AI requests. Each track now steers answers toward that exam’s official syllabus headings, standard books and modules (NCERTs and Laxmikanth for UPSC, bare acts for judiciary, ICAI material for CA, and so on), and PYQ-style practice — without inventing paper years that are not in your notes.",
      ],
    },
    {
      heading: "Structured outputs",
      paragraphs: [
        "Study AI is prompted to return Markdown with headings, lists, and tables when comparing concepts — outputs you can skim before an exam or paste into Doc pages. Combine with relevancy docs when you have an official syllabus PDF to anchor terminology. Substantial answers close with a short Try next line (quiz, mind map, or PYQ-style drill) you can tap or type as a slash command.",
      ],
    },
  ]
);
