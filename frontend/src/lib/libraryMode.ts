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

export function seedLibraryModeForNewUser(goal: StudyGoal | null | undefined) {
  if (typeof window === "undefined") return;
  try {
    const seededKey = "shelf:library-mode-seeded";
    if (localStorage.getItem(seededKey) === "1") return;
    localStorage.setItem(seededKey, "1");
    if (goalHasPreloadedLibrary(goal)) writeLibraryMode("preloaded");
  } catch {
    /* ignore */
  }
}

/** Guests always see preloaded curriculum. Signed-in General stays personal. */
export function resolveLibraryMode(
  goal: StudyGoal | null | undefined,
  preferred: LibraryMode,
  isGuest = false
): LibraryMode {
  if (isGuest) return "preloaded";
  if (!goalHasPreloadedLibrary(goal)) return "personal";
  return preferred;
}
