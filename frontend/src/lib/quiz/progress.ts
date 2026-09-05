/** Time-based step labels while quiz generate/submit is in flight (no server %). */

export type QuizProgressPhase = "creating" | "generating" | "submitting";

type Step = { afterMs: number; label: string; detail: string };

const CREATING: Step[] = [
  {
    afterMs: 0,
    label: "Starting your quiz",
    detail: "Saving settings and preparing the paper…",
  },
  {
    afterMs: 2500,
    label: "Uploading material",
    detail: "Sending notes and scope to Shelf…",
  },
  {
    afterMs: 6000,
    label: "Almost there",
    detail: "Opening the quiz workspace…",
  },
];

const GENERATING: Step[] = [
  {
    afterMs: 0,
    label: "Gathering material",
    detail: "Pulling relevant notes and syllabus context…",
  },
  {
    afterMs: 4000,
    label: "Writing the paper",
    detail: "Drafting exam-level MCQs and written questions…",
  },
  {
    afterMs: 12000,
    label: "Tuning difficulty",
    detail: "Balancing marks, traps, and coverage…",
  },
  {
    afterMs: 22000,
    label: "Finishing touches",
    detail: "Checking the paper before you sit…",
  },
  {
    afterMs: 35000,
    label: "Still working",
    detail: "Longer papers take a bit more time — hang tight…",
  },
];

const SUBMITTING: Step[] = [
  {
    afterMs: 0,
    label: "Submitting your paper",
    detail: "Saving answers and ending the sitting…",
  },
  {
    afterMs: 1500,
    label: "Marking MCQs",
    detail: "Checking objective answers…",
  },
  {
    afterMs: 4000,
    label: "Grading written work",
    detail: "Reviewing written answers and uploaded working…",
  },
  {
    afterMs: 10000,
    label: "Building your results",
    detail: "Scoring and preparing the analysis board…",
  },
];

const STEPS: Record<QuizProgressPhase, Step[]> = {
  creating: CREATING,
  generating: GENERATING,
  submitting: SUBMITTING,
};

/** Soft progress 8→92% from elapsed time; never claims 100% until the job finishes. */
export function quizProgressPercent(
  phase: QuizProgressPhase,
  elapsedMs: number
): number {
  const span =
    phase === "creating" ? 12_000 : phase === "submitting" ? 18_000 : 45_000;
  const t = Math.min(1, Math.max(0, elapsedMs / span));
  // Ease-out so early seconds feel active
  const eased = 1 - (1 - t) * (1 - t);
  return Math.round(8 + eased * 84);
}

export function quizProgressStep(
  phase: QuizProgressPhase,
  elapsedMs: number
): { label: string; detail: string } {
  const steps = STEPS[phase];
  let current = steps[0]!;
  for (const step of steps) {
    if (elapsedMs >= step.afterMs) current = step;
  }
  return { label: current.label, detail: current.detail };
}
