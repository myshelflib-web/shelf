import { StudyGoal } from "@prisma/client";
import { studyGoalLabel } from "../../studyGoal.js";
import { EXAM_GROUNDING, GOAL_TUNING } from "../goalTuning.js";
import type { QuizDifficulty, QuizSourceKind } from "./quizLimits.js";

const DIFFICULTY_LINE: Record<QuizDifficulty, string> = {
  EASY: "Difficulty: easy revision — core facts and direct application. Still exam-clean; no trivia.",
  MEDIUM: "Difficulty: standard paper level — mix of direct and one-step application.",
  HARD: "Difficulty: above-average — traps, multi-concept links, elimination, and analysis.",
  EXAM: "Difficulty: full exam standard for this track (Prelims/Mains/numerical/clinical as the material demands).",
};

export function quizSystemPrompt(
  goal: StudyGoal,
  opts: {
    sourceKind: QuizSourceKind;
    difficulty: QuizDifficulty;
    scopeLabel: string;
    syllabusText?: string | null;
    focusTopic?: string | null;
  }
): string {
  const label = studyGoalLabel(goal);
  const syllabus = opts.syllabusText?.trim();
  const focus = opts.focusTopic?.trim();
  const syllabusBlock = syllabus
    ? `\nOfficial syllabus / relevancy guide (map EVERY question to a heading from this; name the heading):\n---\n${syllabus}\n---`
    : "\nNo custom syllabus attached. Use the study track syllabus in GOAL TUNING and the source material. Prefer relevance to the retrieved notes.";

  const sourceLine =
    opts.sourceKind === "EXAM_BANK"
      ? "Source mode: exam bank. Prefer PYQ compilations, RTPs/MTPs, standard questions, and preloaded curriculum in the excerpts. Recreate paper demand. If a real year/paper is not in the excerpts, label sourceTag PYQ-style or Standard — never invent a citation."
      : opts.sourceKind === "UPLOAD"
        ? "Source mode: uploaded document (and optional syllabus). Quiz only what the upload and syllabus support."
        : "Source mode: the learner's library scope below. Ground stems in those excerpts.";

  return `You are Shelf Quiz, an exam-paper setter for this learner.
Study track: ${label}.
${GOAL_TUNING[goal]}
${EXAM_GROUNDING}
${DIFFICULTY_LINE[opts.difficulty]}
Library / material scope: ${opts.scopeLabel}.
${sourceLine}${syllabusBlock}
${focus ? `Focus the paper on: ${focus}.` : "Cover the highest-yield spread across the material; do not cluster on one paragraph."}

Quality bar:
- Questions must look like a real paper for this track (stem length, traps, marks demand).
- Ground every item in the provided excerpts, syllabus headings, or clearly marked Standard/PYQ-style practice. Do not invent page titles, section numbers, years, or case names that are not in the material.
- If the syllabus is present, refer to it extensively: each item names syllabusHeading.
- Mathematics, physics, chemistry, accounting, GATE numericals: use LaTeX ($inline$ or $$display$$). Show data needed to solve. Never ask a numerical without enough data.
- Law: cite sections only from the material. Medicine: clinical stems, single best answer.
- MCQ: exactly 4 options A–D, one correct. Plausible distractors (common traps). No "all/none of the above", no overlapping options, no giveaways.
- WRITTEN: clear demand (word/marks discipline for Mains; working notes for CA/GATE). modelAnswer is the marking scheme, not a lecture.
- IMAGE: use when the fair answer is a diagram, map, derivation, circuit, or handwritten working. Prompt must state what to draw/upload.
- Mix conceptual and applied. No true/false. No trick questions that hinge on wording alone.
- English unless the material is clearly in another language.

Output: ONLY a JSON object (no markdown fence, no commentary) matching the schema in the user message.`;
}

export function quizJsonSchemaInstruction(mcqCount: number, writtenCount: number): string {
  return `Return JSON:
{
  "title": "short paper title",
  "questions": [
    {
      "type": "MCQ" | "WRITTEN" | "IMAGE",
      "prompt": "markdown stem; LaTeX allowed",
      "options": [{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."},{"id":"D","text":"..."}],
      "correctOptionId": "A",
      "modelAnswer": "marking points / working",
      "explanation": "why the key is right and why traps fail",
      "marks": 1,
      "syllabusHeading": "heading from syllabus or topic name",
      "sourceTag": "Practice" | "Standard" | "PYQ-style"
    }
  ]
}
Rules:
- Emit exactly ${mcqCount} objects with type MCQ (options + correctOptionId required).
- Emit exactly ${writtenCount} objects with type WRITTEN or IMAGE (no options; modelAnswer required). Prefer IMAGE when a diagram or handwritten working is the natural answer.
- Order MCQs first, then written/image.
- marks: MCQ 1 (or 2 if GATE 2-mark style). Written 5–15 matching the track.
- prompt must be self-contained.
- Strict JSON: every key and string in double quotes. No trailing commas. No comments. No markdown fence.
- For LaTeX, escape backslashes (write \\\\frac not \\frac).`;
}

export function gradeWrittenSystemPrompt(goal: StudyGoal): string {
  const label = studyGoalLabel(goal);
  return `You are a strict but fair examiner for ${label}.
Score the learner's answer against the marking scheme only.
Return ONLY JSON: {"score":0.0,"feedback":"2-6 sentences. Name missing points. If math, check the final value and method."}
score is 0 to 1 (fraction of marks earned). 1 = full marks. Partial credit for correct method with arithmetic slips.
If the answer is empty or unrelated, score 0.
If an image of working is attached, read it (handwriting, diagrams, equations) as the answer.`;
}
