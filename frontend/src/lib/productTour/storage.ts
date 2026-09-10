export type TourSurface =
  | "library"
  | "dashboard"
  | "planner"
  | "study-ai"
  | "reader"
  | "quiz";

export const TOUR_SURFACES: TourSurface[] = [
  "library",
  "dashboard",
  "planner",
  "study-ai",
  "reader",
  "quiz",
];

const KEY_PREFIX = "shelf:product-tour:";

export function tourStorageKey(surface: TourSurface, userId: string): string {
  return `${KEY_PREFIX}${surface}:${userId}`;
}

function readFlag(surface: TourSurface, userId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(tourStorageKey(surface, userId));
  } catch {
    return null;
  }
}

export function isTourDone(surface: TourSurface, userId: string): boolean {
  const value = readFlag(surface, userId);
  return value === "done" || value === "skipped";
}

export function markTourDone(
  surface: TourSurface,
  userId: string,
  status: "done" | "skipped" = "done"
) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(tourStorageKey(surface, userId), status);
  } catch {
    /* ignore */
  }
}

export function resetTour(surface: TourSurface, userId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(tourStorageKey(surface, userId));
  } catch {
    /* ignore */
  }
}

export function resetAllTours(userId: string) {
  for (const surface of TOUR_SURFACES) {
    resetTour(surface, userId);
  }
}

/** Surface from a signed-in app pathname, or null when outside tour surfaces. */
export function surfaceFromPathname(pathname: string): TourSurface | null {
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/planner") || pathname.startsWith("/calendar")) {
    return "planner";
  }
  if (pathname.startsWith("/study-ai")) return "study-ai";
  // Quiz home only — skip take/analysis `/quiz/[id]` so missing setup targets
  // do not auto-complete the tour.
  if (pathname === "/quiz" || pathname === "/quiz/") return "quiz";
  // Readers: /my-content/file/…, /…/file/…, /…/…/page
  if (
    pathname.startsWith("/my-content/") &&
    (pathname.includes("/file/") ||
      /^\/my-content\/[^/]+\/[^/]+\/[^/]+\/?$/.test(pathname))
  ) {
    return "reader";
  }
  if (pathname === "/my-content" || pathname.startsWith("/my-content/")) {
    return "library";
  }
  return null;
}
