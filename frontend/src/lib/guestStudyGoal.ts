import { StudyGoal } from "@/types";
import { isStudyGoal } from "@/lib/studyGoal";

export const LEARN_CATALOG_FILTER_KEY = "shelf:learn-catalog-filter";
export const GUEST_STUDY_GOAL_CHANGED = "shelf:learn-catalog-filter-changed";

/** @deprecated use LEARN_CATALOG_FILTER_KEY */
export const GUEST_STUDY_GOAL_KEY = "shelf:guest-study-goal";

/** Catalog filter for /learn — defaults to all tracks (GENERAL). */
export function readLearnCatalogFilter(): StudyGoal {
  if (typeof window === "undefined") return "GENERAL";
  try {
    const raw = localStorage.getItem(LEARN_CATALOG_FILTER_KEY);
    if (isStudyGoal(raw)) return raw;
  } catch {
    /* ignore */
  }
  return "GENERAL";
}

export function writeLearnCatalogFilter(goal: StudyGoal) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LEARN_CATALOG_FILTER_KEY, goal);
    window.dispatchEvent(new Event(GUEST_STUDY_GOAL_CHANGED));
  } catch {
    /* ignore quota */
  }
}

/** @deprecated use readLearnCatalogFilter */
export function readGuestStudyGoal(): StudyGoal {
  return readLearnCatalogFilter();
}

/** @deprecated use writeLearnCatalogFilter */
export function writeGuestStudyGoal(goal: StudyGoal) {
  writeLearnCatalogFilter(goal);
}
