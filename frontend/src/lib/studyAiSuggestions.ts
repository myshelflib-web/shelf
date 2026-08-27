import { hashSeed } from "./livelyCopy";

export type StudyAiSuggestion = {
  id: string;
  label: string;
  /** Slash sent through resolveStudyAiInput, or a plain prompt. */
  insert: string;
  /** Soft accent for action chips (planner / quiz / general). */
  tone?: "action" | "study";
};

const LIBRARY_POOL: StudyAiSuggestion[] = [
  {
    id: "remind",
    label: "Set a reminder",
    insert:
      "Remind me to revise tomorrow evening. Add it to my planner and confirm the time.",
    tone: "action",
  },
  {
    id: "task",
    label: "Add a task",
    insert:
      "Add a planner task titled Finish today’s reading, due Friday, and confirm it.",
    tone: "action",
  },
  {
    id: "make-quiz",
    label: "Make a quiz",
    insert:
      "Create a medium quiz from my library scope (5 MCQs, 2 written) and share the /quiz link when generation starts.",
    tone: "action",
  },
  {
    id: "ask-open",
    label: "Ask anything",
    insert:
      "Answer a useful study question for my exam track even if it is not in my library files. Be clear and structured.",
    tone: "action",
  },
  { id: "quiz", label: "Quiz workspace", insert: "/quiz", tone: "study" },
  { id: "mindmap", label: "Mind map", insert: "/mindmap", tone: "study" },
  { id: "pyq", label: "PYQ drill", insert: "/pyq", tone: "study" },
  { id: "flash", label: "Flashcards", insert: "/flashcards", tone: "study" },
  { id: "notes", label: "Short notes", insert: "/notes", tone: "study" },
  { id: "plan", label: "Revision plan", insert: "/plan", tone: "study" },
  { id: "recap", label: "Recap", insert: "/recap", tone: "study" },
  { id: "gaps", label: "Syllabus gaps", insert: "/gaps", tone: "study" },
  { id: "compare", label: "Compare", insert: "/compare", tone: "study" },
  { id: "outline", label: "Answer outline", insert: "/outline", tone: "study" },
  { id: "define", label: "Key terms", insert: "/define", tone: "study" },
  { id: "example", label: "Worked example", insert: "/example", tone: "study" },
];

const PAGE_POOL: StudyAiSuggestion[] = [
  {
    id: "remind",
    label: "Remind me",
    insert:
      "Add a planner reminder to revisit this page tomorrow evening and confirm it.",
    tone: "action",
  },
  {
    id: "task",
    label: "Schedule reading",
    insert:
      "Add a planner task to finish this page by Friday and link it if you can.",
    tone: "action",
  },
  {
    id: "make-quiz",
    label: "Make a quiz",
    insert:
      "Create a medium quiz on this page (5 MCQs, 2 written) and share the /quiz link when it starts generating.",
    tone: "action",
  },
  {
    id: "ask-open",
    label: "Ask beyond this file",
    insert:
      "Answer a related study question for my exam track even if it is not in this PDF. Say clearly when you leave the file.",
    tone: "action",
  },
  { id: "quiz", label: "Quiz this page", insert: "/quiz", tone: "study" },
  { id: "pyq", label: "PYQ-style", insert: "/pyq", tone: "study" },
  { id: "flash", label: "Flashcards", insert: "/flashcards", tone: "study" },
  { id: "recap", label: "Recap", insert: "/recap", tone: "study" },
  { id: "define", label: "Key terms", insert: "/define", tone: "study" },
  { id: "example", label: "Example", insert: "/example", tone: "study" },
  { id: "compare", label: "Compare", insert: "/compare", tone: "study" },
  { id: "gaps", label: "Syllabus gaps", insert: "/gaps", tone: "study" },
  { id: "formula", label: "Formulas", insert: "/formula", tone: "study" },
  { id: "timeline", label: "Timeline", insert: "/timeline", tone: "study" },
];

/** Shown under the last reply so the chat keeps offering next steps. */
const FOLLOWUP_LIBRARY: StudyAiSuggestion[] = [
  {
    id: "fu-remind",
    label: "Remind me later",
    insert:
      "Based on what we just covered, add a planner reminder for tomorrow to revise this. Confirm the item.",
    tone: "action",
  },
  {
    id: "fu-quiz",
    label: "Quiz me on this",
    insert:
      "Create a short medium quiz on what we just discussed and share the /quiz link.",
    tone: "action",
  },
  {
    id: "fu-deeper",
    label: "Go deeper",
    insert: "Go one level deeper on the main idea from your last answer.",
    tone: "study",
  },
  {
    id: "fu-simpler",
    label: "Simpler take",
    insert: "Explain the same idea more simply, then restore key exam terms.",
    tone: "study",
  },
  {
    id: "fu-plan",
    label: "Add a study task",
    insert:
      "Turn the last answer into one concrete planner task for this week.",
    tone: "action",
  },
  {
    id: "fu-flash",
    label: "Flashcards",
    insert: "/flashcards",
    tone: "study",
  },
  {
    id: "fu-example",
    label: "Another example",
    insert: "Give another worked example for the same topic.",
    tone: "study",
  },
  {
    id: "fu-open",
    label: "Related question",
    insert:
      "Ask and answer one related question that is useful for my exam track, even outside my files.",
    tone: "action",
  },
];

const FOLLOWUP_PAGE: StudyAiSuggestion[] = [
  {
    id: "fu-remind",
    label: "Remind me",
    insert:
      "Add a reminder to revisit this page tomorrow based on what we just covered.",
    tone: "action",
  },
  {
    id: "fu-quiz",
    label: "Quiz this",
    insert:
      "Create a short quiz on this page from what we discussed and share the /quiz link.",
    tone: "action",
  },
  {
    id: "fu-summarize",
    label: "Summarize",
    insert: "/summarize",
    tone: "study",
  },
  {
    id: "fu-deeper",
    label: "Go deeper",
    insert: "Expand on the key point from your last answer using this file.",
    tone: "study",
  },
  {
    id: "fu-task",
    label: "Schedule finish",
    insert: "Add a planner task to finish this page by Friday.",
    tone: "action",
  },
  {
    id: "fu-flash",
    label: "Flashcards",
    insert: "/flashcards",
    tone: "study",
  },
  {
    id: "fu-open",
    label: "Beyond this file",
    insert:
      "Answer a related question for my study goal even if it is not in this PDF.",
    tone: "action",
  },
  {
    id: "fu-notes",
    label: "Short notes",
    insert: "/notes",
    tone: "study",
  },
];

const HINTS_LIBRARY = [
  "Try a reminder, a quiz, or anything on your mind",
  "Ask beyond your notes — or add a planner task",
  "Study AI can schedule, quiz, and explain",
  "Pick a chip, or type / for commands",
];

const HINTS_PAGE = [
  "Ask this page — or beyond it",
  "Reminders, quizzes, and recaps live here",
  "Highlight a line, or try a suggestion",
  "Type / for commands · chips rotate below",
];

const HINTS_FOLLOWUP = [
  "What’s next?",
  "Keep going — or park it on your planner",
  "Quiz it, schedule it, or go deeper",
  "Another step when you’re ready",
];

export const STUDY_AI_SUGGEST_ROTATE_MS = 10_000;
export const STUDY_AI_HINT_ROTATE_MS = 8_000;

/** Map a chip label back to its slash insert (for edit/resubmit). */
export function slashInsertForSuggestLabel(label: string): string | null {
  const key = label.trim().toLowerCase();
  if (!key) return null;
  const hit = [
    ...LIBRARY_POOL,
    ...PAGE_POOL,
    ...FOLLOWUP_LIBRARY,
    ...FOLLOWUP_PAGE,
  ].find((i) => i.label.toLowerCase() === key);
  return hit?.insert ?? null;
}

function rotatePool<T>(pool: T[], offset: number, count: number): T[] {
  const n = Math.min(count, pool.length);
  const start = ((offset % pool.length) + pool.length) % pool.length;
  return [...pool.slice(start), ...pool.slice(0, start)].slice(0, n);
}

export function pickStudyAiSuggestions(
  scope: "library" | "page",
  opts: {
    slot: number;
    sessionSeed?: string | number;
    count?: number;
  }
): StudyAiSuggestion[] {
  const pool = scope === "page" ? PAGE_POOL : LIBRARY_POOL;
  const count = Math.min(opts.count ?? 3, pool.length);
  const offset =
    (hashSeed("suggest", scope, opts.sessionSeed ?? "shelf") + opts.slot) %
    pool.length;
  return rotatePool(pool, offset, count);
}

export function pickStudyAiFollowUps(
  scope: "library" | "page",
  opts: {
    slot: number;
    sessionSeed?: string | number;
    count?: number;
  }
): StudyAiSuggestion[] {
  const pool = scope === "page" ? FOLLOWUP_PAGE : FOLLOWUP_LIBRARY;
  const count = Math.min(opts.count ?? 3, pool.length);
  const offset =
    (hashSeed("followup", scope, opts.sessionSeed ?? "shelf") + opts.slot) %
    pool.length;
  return rotatePool(pool, offset, count);
}

export function pickStudyAiHint(
  kind: "library" | "page" | "followup",
  opts: { slot: number; sessionSeed?: string | number }
): string {
  const pool =
    kind === "followup"
      ? HINTS_FOLLOWUP
      : kind === "page"
        ? HINTS_PAGE
        : HINTS_LIBRARY;
  const i =
    (hashSeed("hint", kind, opts.sessionSeed ?? "shelf") + opts.slot) %
    pool.length;
  return pool[i] ?? pool[0];
}
