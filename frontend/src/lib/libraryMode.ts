import { parseLearnPath } from "@/lib/learnCatalog";
import { StudyGoal } from "@/types";
import { goalHasPreloadedLibrary, normalizeStudyGoal } from "@/lib/studyGoal";

export type LibraryMode = "personal" | "preloaded";

export const LIBRARY_MODE_KEY = "shelf:library-mode";
export const SHELF_LIBRARY_MODE_CHANGED = "shelf:library-mode-changed";

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
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(SHELF_LIBRARY_MODE_CHANGED, { detail: { mode } })
      );
    }
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

/** Guests always see preloaded. Signed-in users honor preference;
 *  General defaults to personal, exam goals default to preloaded. */
export function resolveLibraryMode(
  goal: StudyGoal | null | undefined,
  preferred: LibraryMode | null,
  isGuest = false
): LibraryMode {
  if (isGuest) return "preloaded";
  if (preferred) return preferred;
  if (normalizeStudyGoal(goal) === "GENERAL") return "personal";
  return "preloaded";
}

/** When a reader tab is open, pick Personal vs Preloaded from the URL. */
export function inferLibraryModeFromHref(
  href?: string | null
): LibraryMode | null {
  if (!href) return null;
  const path = (href.split("?")[0] ?? href).replace(/\/$/, "");
  if (path.startsWith("/learn/")) {
    if (path.startsWith("/learn/current-affairs/") && path !== "/learn/current-affairs") {
      return "preloaded";
    }
    const { articleSlug } = parseLearnPath(path);
    return articleSlug ? "preloaded" : null;
  }
  if (path.startsWith("/my-content/") && path !== "/my-content") {
    return "personal";
  }
  return null;
}
