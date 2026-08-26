import { hashSeed } from "./livelyCopy";

export type StudyAiSuggestion = {
  id: string;
  label: string;
  /** Slash sent through resolveStudyAiInput, or a plain prompt. */
  insert: string;
};

const LIBRARY_POOL: StudyAiSuggestion[] = [
  { id: "quiz", label: "Quiz me", insert: "/quiz" },
  { id: "mindmap", label: "Mind map", insert: "/mindmap" },
  { id: "pyq", label: "PYQ drill", insert: "/pyq" },
  { id: "flash", label: "Flashcards", insert: "/flashcards" },
  { id: "notes", label: "Short notes", insert: "/notes" },
  { id: "plan", label: "Revision plan", insert: "/plan" },
  { id: "recap", label: "Recap", insert: "/recap" },
  { id: "gaps", label: "Syllabus gaps", insert: "/gaps" },
  { id: "compare", label: "Compare", insert: "/compare" },
  { id: "outline", label: "Answer outline", insert: "/outline" },
  { id: "define", label: "Key terms", insert: "/define" },
  { id: "example", label: "Worked example", insert: "/example" },
];

const PAGE_POOL: StudyAiSuggestion[] = [
  { id: "quiz", label: "Quiz this page", insert: "/quiz" },
  { id: "pyq", label: "PYQ-style", insert: "/pyq" },
  { id: "flash", label: "Flashcards", insert: "/flashcards" },
  { id: "recap", label: "Recap", insert: "/recap" },
  { id: "define", label: "Key terms", insert: "/define" },
  { id: "example", label: "Example", insert: "/example" },
  { id: "compare", label: "Compare", insert: "/compare" },
  { id: "gaps", label: "Syllabus gaps", insert: "/gaps" },
  { id: "formula", label: "Formulas", insert: "/formula" },
  { id: "timeline", label: "Timeline", insert: "/timeline" },
];

export const STUDY_AI_SUGGEST_ROTATE_MS = 10_000;

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
  return [...pool.slice(offset), ...pool.slice(0, offset)].slice(0, count);
}
