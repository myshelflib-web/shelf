/** Update the address bar without a Next.js navigation (avoids remounting the reader). */
export function softReplace(href: string) {
  if (typeof window === "undefined") return;
  try {
    const next = new URL(href, window.location.origin);
    const cur = window.location;
    if (next.pathname === cur.pathname && next.search === cur.search) return;
    window.history.replaceState(window.history.state ?? {}, "", next.pathname + next.search);
  } catch {
    /* ignore */
  }
}

export function softPush(href: string) {
  if (typeof window === "undefined") return;
  try {
    const next = new URL(href, window.location.origin);
    const cur = window.location;
    if (next.pathname === cur.pathname && next.search === cur.search) return;
    window.history.pushState(window.history.state ?? {}, "", next.pathname + next.search);
  } catch {
    /* ignore */
  }
}

/** True when both hrefs are page readers (personal or public curriculum). */
export function isReaderHref(href: string): boolean {
  const path = href.split("?")[0] ?? href;
  return Boolean(
    path.match(/^\/learn\/[^/]+\/[^/]+\/[^/]+$/) ||
      path.match(/^\/my-content\/shared\/[^/]+$/) ||
      path.match(/^\/my-content\/file\/[^/]+$/) ||
      path.match(/^\/my-content\/[^/]+\/file\/[^/]+$/) ||
      path.match(/^\/my-content\/[^/]+\/[^/]+\/[^/]+$/)
  );
}
