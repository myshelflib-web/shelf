/** Cite a PDF/HTML highlight into an open Doc tab. */

export type CiteInDocDetail = {
  quote: string;
  pageTitle?: string;
  pageNumber?: number | null;
  sourcePageId?: string;
  href?: string;
};

export const CITE_IN_DOC_EVENT = "shelf:cite-in-doc";
const PENDING_KEY = "shelf-pending-cite-in-doc";

export function hasOpenDocBody(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(document.querySelector(".shelf-doc-body[contenteditable]"));
}

/** Dispatch to open Doc(s), or stash for the next Doc mount. Returns whether a Doc was open. */
export function citeInOpenDoc(detail: CiteInDocDetail): boolean {
  if (!detail.quote.trim()) return false;
  if (hasOpenDocBody()) {
    window.dispatchEvent(
      new CustomEvent(CITE_IN_DOC_EVENT, { detail })
    );
    return true;
  }
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(detail));
  } catch {
    /* ignore */
  }
  window.alert(
    "No Doc is open. Open or create a Doc tab, then use Cite again — or the quote will insert when a Doc opens."
  );
  return false;
}

export function consumePendingCite(): CiteInDocDetail | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_KEY);
    return JSON.parse(raw) as CiteInDocDetail;
  } catch {
    return null;
  }
}
