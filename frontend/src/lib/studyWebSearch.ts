const PAGE_KEY = "shelf:study-web-search:page";
const LIBRARY_KEY = "shelf:study-web-search:library";

export type StudyWebSearchScope = "page" | "library";

function storageKey(scope: StudyWebSearchScope): string {
  return scope === "page" ? PAGE_KEY : LIBRARY_KEY;
}

/** Reader Ask defaults off; full Study AI chat defaults on (existing behavior). */
export function getStoredStudyWebSearch(
  scope: StudyWebSearchScope
): boolean {
  if (typeof window === "undefined") {
    return scope === "library";
  }
  try {
    const raw = localStorage.getItem(storageKey(scope));
    if (raw === null) return scope === "library";
    return raw === "1" || raw === "true";
  } catch {
    return scope === "library";
  }
}

export function setStoredStudyWebSearch(
  scope: StudyWebSearchScope,
  enabled: boolean
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(scope), enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
}
