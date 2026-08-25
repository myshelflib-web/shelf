export type TabViewState = {
  /** PDF page (1-based) */
  pdfPage?: number;
  /** 0–1 offset within the current PDF page (survives zoom better than scrollTop). */
  pageOffset?: number;
  scrollTop?: number;
  /** Horizontal pan for blank-canvas notes. */
  scrollLeft?: number;
  scale?: number;
  darkPdf?: boolean;
  /** Epoch ms — used to reconcile local vs server. */
  updatedAt?: number;
};

export type PageViewPayload = {
  pdfPage?: number | null;
  pageOffset?: number | null;
  scrollTop?: number | null;
  scale?: number | null;
  viewedAt?: string | null;
};

export type LastRead = {
  href: string;
  title: string;
  notebookSlug: string | null;
  topicSlug?: string | null;
  viewedAt?: number;
};

export type LastReadSync = {
  last: LastRead | null;
  notebooks: Record<string, LastRead>;
};

const VIEW_KEY = "shelf:reader-view-state";
const LAST_READ_KEY = "shelf:last-read";
const NOTEBOOK_LAST_KEY = "shelf:notebook-last-read";
const ROOT_LAST_KEY = "__root__";
const MAX_ENTRIES = 40;
const MAX_NOTEBOOKS = 40;

function canUseStorage() {
  return typeof localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

function loadAll(): Record<string, TabViewState> {
  return readJson<Record<string, TabViewState>>(VIEW_KEY, {});
}

function saveAll(map: Record<string, TabViewState>) {
  const keys = Object.keys(map);
  if (keys.length > MAX_ENTRIES) {
    const trimmed = keys.slice(-MAX_ENTRIES);
    const next: Record<string, TabViewState> = {};
    for (const k of trimmed) next[k] = map[k]!;
    map = next;
  }
  writeJson(VIEW_KEY, map);
}

export function getTabViewState(href: string): TabViewState | undefined {
  return loadAll()[href];
}

export function setTabViewState(href: string, patch: TabViewState) {
  const all = loadAll();
  const prev = all[href];
  delete all[href]; // refresh LRU insertion order
  all[href] = {
    ...prev,
    ...patch,
    updatedAt: patch.updatedAt ?? Date.now(),
  };
  saveAll(all);
}

export function hasRestorableView(view?: TabViewState | null): boolean {
  if (!view) return false;
  return (
    (typeof view.pdfPage === "number" && view.pdfPage > 1) ||
    (typeof view.pageOffset === "number" && view.pageOffset > 0) ||
    (typeof view.scrollTop === "number" && view.scrollTop > 0) ||
    (typeof view.scrollLeft === "number" && view.scrollLeft > 0)
  );
}

export function viewStateFromPage(view?: PageViewPayload | null): TabViewState | undefined {
  if (!view) return undefined;
  const next: TabViewState = {};
  if (typeof view.pdfPage === "number" && view.pdfPage >= 1) {
    next.pdfPage = view.pdfPage;
  }
  if (typeof view.pageOffset === "number" && view.pageOffset >= 0) {
    next.pageOffset = view.pageOffset;
  }
  if (typeof view.scrollTop === "number" && view.scrollTop >= 0) {
    next.scrollTop = view.scrollTop;
  }
  if (typeof view.scale === "number" && view.scale > 0) {
    next.scale = view.scale;
  }
  if (view.viewedAt) {
    const t = Date.parse(view.viewedAt);
    if (Number.isFinite(t)) next.updatedAt = t;
  }
  return Object.keys(next).length ? next : undefined;
}

/** Local cache vs account (newer timestamp wins). Keep device-only darkPdf. */
export function pickNewerView(
  local?: TabViewState,
  server?: TabViewState
): TabViewState | undefined {
  const darkPdf = local?.darkPdf ?? server?.darkPdf;
  const localHas = hasRestorableView(local) || local?.pdfPage != null || local?.scale != null;
  const serverHas =
    hasRestorableView(server) || server?.pdfPage != null || server?.scale != null;
  if (!localHas && !serverHas) {
    return darkPdf != null ? { darkPdf } : undefined;
  }
  if (!serverHas) return local;
  if (!localHas) {
    return darkPdf != null ? { ...server, darkPdf } : server;
  }
  const winner =
    (server?.updatedAt ?? 0) > (local?.updatedAt ?? 0) ? server : local;
  return darkPdf != null ? { ...winner, darkPdf } : winner;
}

export function toServerView(view: TabViewState): {
  pdfPage?: number;
  pageOffset?: number;
  scrollTop?: number;
  scale?: number;
} {
  const out: {
    pdfPage?: number;
    pageOffset?: number;
    scrollTop?: number;
    scale?: number;
  } = {};
  if (typeof view.pdfPage === "number") out.pdfPage = view.pdfPage;
  if (typeof view.pageOffset === "number") out.pageOffset = view.pageOffset;
  if (typeof view.scrollTop === "number") out.scrollTop = view.scrollTop;
  if (typeof view.scale === "number") out.scale = view.scale;
  return out;
}

function notebookStorageKey(
  notebookSlug: string | null,
  topicSlug?: string | null
): string {
  if (!notebookSlug) return ROOT_LAST_KEY;
  if (topicSlug) return `${notebookSlug}/${topicSlug}`;
  return notebookSlug;
}

export function setLastRead(entry: LastRead) {
  const next = { ...entry, viewedAt: entry.viewedAt ?? Date.now() };
  writeJson(LAST_READ_KEY, next);
  const map = readJson<Record<string, LastRead>>(NOTEBOOK_LAST_KEY, {});
  const notebookKey = notebookStorageKey(entry.notebookSlug);
  delete map[notebookKey];
  map[notebookKey] = next;
  if (entry.topicSlug && entry.notebookSlug) {
    const topicKey = notebookStorageKey(entry.notebookSlug, entry.topicSlug);
    delete map[topicKey];
    map[topicKey] = next;
  }
  const keys = Object.keys(map);
  if (keys.length > MAX_NOTEBOOKS) {
    const trimmed = keys.slice(-MAX_NOTEBOOKS);
    const nextMap: Record<string, LastRead> = {};
    for (const k of trimmed) nextMap[k] = map[k]!;
    writeJson(NOTEBOOK_LAST_KEY, nextMap);
    return;
  }
  writeJson(NOTEBOOK_LAST_KEY, map);
}

export function getLastRead(): LastRead | null {
  const value = readJson<LastRead | null>(LAST_READ_KEY, null);
  return value?.href ? value : null;
}

export function getNotebookLastRead(
  notebookSlug: string,
  topicSlug?: string | null
): LastRead | null {
  const map = readJson<Record<string, LastRead>>(NOTEBOOK_LAST_KEY, {});
  const key = notebookStorageKey(notebookSlug, topicSlug);
  const value = map[key];
  return value?.href ? value : null;
}

/** Collection-level last reads, newest first (excludes root pages and topic keys). */
export function getRecentNotebookReads(): LastRead[] {
  const map = readJson<Record<string, LastRead>>(NOTEBOOK_LAST_KEY, {});
  return Object.entries(map)
    .filter(
      ([key, value]) =>
        Boolean(value?.href) &&
        key !== ROOT_LAST_KEY &&
        !key.includes("/")
    )
    .map(([, value]) => value)
    .sort((a, b) => (b.viewedAt ?? 0) - (a.viewedAt ?? 0));
}

export function clearLastReads() {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(LAST_READ_KEY);
    localStorage.removeItem(NOTEBOOK_LAST_KEY);
  } catch {
    /* ignore */
  }
}

/** Merge last-read from the account without clobbering a newer local session. */
export function hydrateLastReads(payload: LastReadSync) {
  const serverNotebooks = payload.notebooks ?? {};
  const hasServerLast = Boolean(payload.last?.href);
  const hasServerNotebooks = Object.keys(serverNotebooks).length > 0;

  // Account has no reading history — drop stale local continue-reading (e.g. other user).
  if (!hasServerLast && !hasServerNotebooks) {
    clearLastReads();
    return;
  }

  if (hasServerLast && payload.last) {
    const local = getLastRead();
    if (!local || (payload.last.viewedAt ?? 0) >= (local.viewedAt ?? 0)) {
      writeJson(LAST_READ_KEY, payload.last);
    }
  } else if (canUseStorage()) {
    localStorage.removeItem(LAST_READ_KEY);
  }

  const map = readJson<Record<string, LastRead>>(NOTEBOOK_LAST_KEY, {});
  for (const [key, entry] of Object.entries(serverNotebooks)) {
    if (!entry?.href) continue;
    const prev = map[key];
    if (!prev || (entry.viewedAt ?? 0) >= (prev.viewedAt ?? 0)) {
      map[key] = entry;
    }
  }
  writeJson(NOTEBOOK_LAST_KEY, map);
}
