export type RankedExcerpt = {
  pageId: string;
  title: string;
  notebook: string;
  topic: string;
  href: string;
  text: string;
  score: number;
};

function chunkKey(ex: RankedExcerpt): string {
  return `${ex.pageId}:${ex.text.slice(0, 72)}`;
}

/** Reciprocal rank fusion across ranked lists (vector + keyword). */
export function reciprocalRankFusion(
  lists: RankedExcerpt[][],
  k = 60
): RankedExcerpt[] {
  const byKey = new Map<string, RankedExcerpt & { rrf: number }>();
  for (const list of lists) {
    list.forEach((ex, rank) => {
      const key = chunkKey(ex);
      const add = 1 / (k + rank + 1);
      const prev = byKey.get(key);
      if (!prev) {
        byKey.set(key, { ...ex, rrf: add });
        return;
      }
      prev.rrf += add;
      prev.score = Math.max(prev.score, ex.score);
      if (ex.text.length > prev.text.length) prev.text = ex.text;
    });
  }
  return [...byKey.values()]
    .sort((a, b) => b.rrf - a.rrf || b.score - a.score)
    .map(({ rrf: _rrf, ...ex }) => ex);
}

/** Prefer coverage across pages, then fill leftover slots from overflow. */
export function diversifyExcerpts(
  excerpts: RankedExcerpt[],
  limit: number,
  maxPerPage = 2
): RankedExcerpt[] {
  const counts = new Map<string, number>();
  const picked: RankedExcerpt[] = [];
  const overflow: RankedExcerpt[] = [];
  for (const ex of excerpts) {
    const n = counts.get(ex.pageId) ?? 0;
    if (n < maxPerPage) {
      picked.push(ex);
      counts.set(ex.pageId, n + 1);
    } else {
      overflow.push(ex);
    }
    if (picked.length >= limit) return picked.slice(0, limit);
  }
  for (const ex of overflow) {
    if (picked.length >= limit) break;
    picked.push(ex);
  }
  return picked.slice(0, limit);
}
