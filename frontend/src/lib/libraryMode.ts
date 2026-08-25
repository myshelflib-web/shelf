import { StudyGoal } from "@/types";
import { goalHasPreloadedLibrary } from "@/lib/studyGoal";

export type LibraryMode = "personal" | "preloaded";

export const LIBRARY_MODE_KEY = "shelf:library-mode";

export function readLibraryMode(): LibraryMode {
  if (typeof window === "undefined") return "personal";
  try {
    const raw = localStorage.getItem(LIBRARY_MODE_KEY);
    return raw === "preloaded" ? "preloaded" : "personal";
  } catch {
    return "personal";
  }
}

export function writeLibraryMode(mode: LibraryMode) {
  try {
    localStorage.setItem(LIBRARY_MODE_KEY, mode);
  } catch {
    /* ignore */
  }
}

/** Force personal when General; guests stay on preloaded when available. */
export function resolveLibraryMode(
  goal: StudyGoal | null | undefined,
  preferred: LibraryMode,
  isGuest = false
): LibraryMode {
  if (!goalHasPreloadedLibrary(goal)) return "personal";
  if (isGuest) return "preloaded";
  return preferred;
}
