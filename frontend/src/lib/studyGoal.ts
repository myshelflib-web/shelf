import { StudyGoal } from "@/types";

export const STUDY_GOAL_LABELS: Record<StudyGoal, string> = {
  GENERAL: "General",
  UPSC: "UPSC (Civil Services)",
  STATE_PCS: "State PCS",
  JUDICIARY: "Judiciary",
  CA: "CA (Inter / Final)",
  NEET_PG: "NEET PG / INI-CET",
  GATE: "GATE",
};

export type StudyGoalGroup = {
  label: string;
  options: StudyGoal[];
};

/** Labels for the public /learn catalog filter (GENERAL = show all tracks). */
export const LEARN_CATALOG_GOAL_LABELS: Record<StudyGoal, string> = {
  ...STUDY_GOAL_LABELS,
  GENERAL: "All tracks",
};

export const STUDY_GOAL_GROUPS: StudyGoalGroup[] = [
  { label: "General", options: ["GENERAL"] },
  {
    label: "Civil services",
    options: ["UPSC", "STATE_PCS", "JUDICIARY"],
  },
  {
    label: "Professional / PG",
    options: ["CA", "NEET_PG", "GATE"],
  },
];

/** Goal groups for the /learn catalog filter dropdown. */
export const LEARN_CATALOG_GOAL_GROUPS: StudyGoalGroup[] = [
  { label: "All tracks", options: ["GENERAL"] },
  ...STUDY_GOAL_GROUPS.slice(1),
];

/** Flat list kept for callers that need every goal. */
export const STUDY_GOAL_OPTIONS = Object.entries(STUDY_GOAL_LABELS) as [
  StudyGoal,
  string,
][];

export function isStudyGoal(value: unknown): value is StudyGoal {
  return typeof value === "string" && value in STUDY_GOAL_LABELS;
}

/** Map legacy / unknown values (e.g. stale localStorage) to a valid goal. */
export function normalizeStudyGoal(value: unknown): StudyGoal {
  if (value === "UPSC") return "UPSC";
  if (isStudyGoal(value)) return value;
  return "GENERAL";
}

export function goalHasPreloadedLibrary(
  goal: StudyGoal | null | undefined
): boolean {
  return normalizeStudyGoal(goal) !== "GENERAL";
}
