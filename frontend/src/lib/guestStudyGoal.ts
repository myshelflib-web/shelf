import { StudyGoal } from "@/types";
import { isStudyGoal, normalizeStudyGoal } from "@/lib/studyGoal";

export const GUEST_STUDY_GOAL_KEY = "shelf:guest-study-goal";
export const GUEST_STUDY_GOAL_CHANGED = "shelf:guest-study-goal-changed";

export function readGuestStudyGoal(): StudyGoal {
  if (typeof window === "undefined") return "UPSC";
  try {
    const raw = localStorage.getItem(GUEST_STUDY_GOAL_KEY);
    if (isStudyGoal(raw)) return raw;
  } catch {
    /* ignore */
  }
  return "UPSC";
}

export function writeGuestStudyGoal(goal: StudyGoal) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_STUDY_GOAL_KEY, goal);
    window.dispatchEvent(new Event(GUEST_STUDY_GOAL_CHANGED));
  } catch {
    /* ignore quota */
  }
}

/** Goal used to filter public /learn catalog (guest picker or signed-in profile). */
export function learnCatalogGoal(
  userGoal: StudyGoal | null | undefined,
  guestGoal: StudyGoal
): StudyGoal {
  if (userGoal) return normalizeStudyGoal(userGoal);
  return guestGoal;
}
