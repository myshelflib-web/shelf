import { StudyGoal } from "@/types";
import { goalHasPreloadedLibrary } from "@/lib/studyGoal";

export type LibraryMode = "personal" | "preloaded";

export const LIBRARY_MODE_KEY = "shelf:library-mode";

export function readLibraryMode(): LibraryMode | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LIBRARY_MODE_KEY);
    if (raw === "preloaded" || raw === "personal") return raw;
    return null;
  } catch {
    return null;
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

/** Guests always see preloaded. Signed-in General stays personal.
 *  Exam goals default to preloaded until the user picks Personal. */
export function resolveLibraryMode(
  goal: StudyGoal | null | undefined,
  preferred: LibraryMode | null,
  isGuest = false
): LibraryMode {
  if (isGuest) return "preloaded";
  if (!goalHasPreloadedLibrary(goal)) return "personal";
  return preferred ?? "preloaded";
}
