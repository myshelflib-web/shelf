export const NOTEBOOK_PAGE_SIZE = 8;

export type NotebookSort =
  | "recent"
  | "oldest"
  | "name"
  | "nameDesc"
  | "pages"
  | "order";
export type NotebookFilter =
  | "all"
  | "with-pages"
  | "empty"
  | "pdf"
  | "link"
  | "starred";

export interface SlimNotebook {
  id: string;
  name: string;
  description: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  pageCount: number;
  hasPdf: boolean;
  hasLink: boolean;
  hasStarred: boolean;
  pageTitles: string[];
}

export function parseNotebookSort(raw: unknown): NotebookSort {
  const v = String(raw ?? "");
  if (
    v === "recent" ||
    v === "oldest" ||
    v === "name" ||
    v === "nameDesc" ||
    v === "pages" ||
    v === "order"
  ) {
    return v;
  }
  return "recent";
}

export function parseNotebookFilter(raw: unknown): NotebookFilter {
  const v = String(raw ?? "");
  if (
    v === "with-pages" ||
    v === "empty" ||
    v === "pdf" ||
    v === "link" ||
    v === "starred"
  ) {
    return v;
  }
  return "all";
}

export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (Math.abs(a.length - b.length) > 10) return 99;
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array<number>(n + 1);
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[n];
}

function haystack(nb: SlimNotebook): string {
  return `${nb.name} ${nb.description ?? ""} ${nb.pageTitles.join(" ")}`.toLowerCase();
}

/** Lower is closer. `null` means the notebook is not a reasonable match. */
export function relevanceScore(q: string, nb: SlimNotebook): number | null {
  const query = q.trim().toLowerCase();
  if (!query) return 0;
  const name = nb.name.toLowerCase();
  if (name === query) return 0;
  if (name.startsWith(query)) return 1;
  if (name.includes(query)) return 2;

  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every((t) => name.includes(t))) return 3;

  const blob = haystack(nb);
  if (blob.includes(query)) return 4;
  if (tokens.every((t) => blob.includes(t))) return 5;

  const words = name.split(/[^a-z0-9]+/).filter(Boolean);
  let best = editDistance(query, name);
  for (const word of words) {
    best = Math.min(best, editDistance(query, word));
    if (word.startsWith(query) || query.startsWith(word)) {
      best = Math.min(best, 1);
    }
  }
  for (const title of nb.pageTitles) {
    const t = title.toLowerCase();
    if (t.includes(query)) return 4;
    best = Math.min(best, editDistance(query, t) + 2);
  }

  const allowed = Math.max(2, Math.floor(query.length * 0.4));
  if (best <= allowed) return 8 + best;
  return null;
}

export function matchesFilter(nb: SlimNotebook, filter: NotebookFilter): boolean {
  switch (filter) {
    case "with-pages":
      return nb.pageCount > 0;
    case "empty":
      return nb.pageCount === 0;
    case "pdf":
      return nb.hasPdf;
    case "link":
      return nb.hasLink;
    case "starred":
      return nb.hasStarred;
    default:
      return true;
  }
}

function compareSort(a: SlimNotebook, b: SlimNotebook, sort: NotebookSort): number {
  switch (sort) {
    case "oldest":
      return a.createdAt.getTime() - b.createdAt.getTime();
    case "name":
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    case "nameDesc":
      return b.name.localeCompare(a.name, undefined, { sensitivity: "base" });
    case "pages":
      return b.pageCount - a.pageCount || a.name.localeCompare(b.name);
    case "order":
      return a.order - b.order || a.name.localeCompare(b.name);
    default:
      return b.updatedAt.getTime() - a.updatedAt.getTime();
  }
}

export function browseNotebooks(
  items: SlimNotebook[],
  opts: {
    q?: string;
    filter?: NotebookFilter;
    sort?: NotebookSort;
    page?: number;
    pageSize?: number;
  }
): { ids: string[]; total: number; page: number; totalPages: number } {
  const pageSize = Math.min(
    NOTEBOOK_PAGE_SIZE,
    Math.max(1, opts.pageSize ?? NOTEBOOK_PAGE_SIZE)
  );
  const filter = opts.filter ?? "all";
  const sort = opts.sort ?? "recent";
  const q = (opts.q ?? "").trim();

  const scored = items
    .filter((nb) => matchesFilter(nb, filter))
    .map((nb) => ({ nb, score: relevanceScore(q, nb) }))
    .filter((row): row is { nb: SlimNotebook; score: number } => row.score !== null);

  scored.sort((a, b) => {
    if (q && a.score !== b.score) return a.score - b.score;
    return compareSort(a.nb, b.nb, sort);
  });

  const total = scored.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const page = Math.min(Math.max(1, opts.page ?? 1), totalPages);
  const start = (page - 1) * pageSize;
  const ids = scored.slice(start, start + pageSize).map((row) => row.nb.id);
  return { ids, total, page, totalPages };
}
