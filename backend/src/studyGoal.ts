import { StudyGoal } from "@prisma/client";

export const STUDY_GOAL_LABELS: Record<StudyGoal, string> = {
  GENERAL: "General",
  UPSC: "UPSC (Civil Services)",
  STATE_PCS: "State PCS",
  JUDICIARY: "Judiciary",
  CA: "CA (Inter / Final)",
  NEET_PG: "NEET PG / INI-CET",
  GATE: "GATE",
};

export const STUDY_GOALS = Object.keys(STUDY_GOAL_LABELS) as StudyGoal[];

export function isStudyGoal(value: unknown): value is StudyGoal {
  return typeof value === "string" && value in STUDY_GOAL_LABELS;
}

export function studyGoalLabel(goal: StudyGoal | null | undefined): string {
  return STUDY_GOAL_LABELS[goal ?? "GENERAL"];
}

export function goalHasPreloadedLibrary(
  goal: StudyGoal | null | undefined
): boolean {
  return (goal ?? "GENERAL") !== "GENERAL";
}
