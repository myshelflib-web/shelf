export type NewsSourceItem = {
  id: string;
  title: string;
  canonicalUrl: string;
  sourceName: string;
  publishedAt: Date | null;
  /** Shelf-written summary produced at ingest time (already licence-filtered). */
  summary: string;
  /** Short factual excerpt permitted by the source licence. */
  excerpt: string;
  tags: string[];
};

export type NewsCluster = {
  /** Stable slug seed derived from the lead item. */
  key: string;
  leadTitle: string;
  items: NewsSourceItem[];
  /** Number of distinct publishers backing the cluster. */
  sourceCount: number;
};

export type NewsBrief = {
  title: string;
  metaDescription: string;
  whatHappened: string[];
  whyItMatters: string[];
  keyFacts: string[];
  syllabusLinks: string[];
  prelimsPointers: string[];
  mainsAngle: string[];
  keywords: string[];
};

export type NewsReview = {
  score: number;
  unsupported: string[];
  copiedPhrases: string[];
  verdict: "pass" | "revise";
};

function reviveItem(value: unknown): NewsSourceItem | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const title = typeof raw.title === "string" ? raw.title : "";
  if (!title) return null;

  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const published = str(raw.publishedAt);

  return {
    id: str(raw.id),
    title,
    canonicalUrl: str(raw.canonicalUrl),
    sourceName: str(raw.sourceName),
    publishedAt: published ? new Date(published) : null,
    summary: str(raw.summary),
    excerpt: str(raw.excerpt),
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === "string") : [],
  };
}

/** Caps cluster text so a paused news job does not pin full summaries in JSON. */
export function compactClusterForPlan(cluster: NewsCluster): NewsCluster {
  const cap = 480;
  return {
    key: cluster.key,
    leadTitle: cluster.leadTitle.slice(0, 200),
    sourceCount: cluster.sourceCount,
    items: cluster.items.map((item) => ({
      ...item,
      summary: item.summary.slice(0, cap),
      excerpt: item.excerpt.slice(0, cap),
      tags: item.tags.slice(0, 8),
    })),
  };
}

/** Rebuilds a cluster stored on a job item, restoring Date fields lost to JSON. */
export function parseStoredCluster(value: unknown): NewsCluster | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const key = typeof raw.key === "string" ? raw.key : "";
  if (!key) return null;

  const items = (Array.isArray(raw.items) ? raw.items : [])
    .map(reviveItem)
    .filter((i): i is NewsSourceItem => i !== null);
  if (items.length === 0) return null;

  return {
    key,
    leadTitle: typeof raw.leadTitle === "string" ? raw.leadTitle : items[0].title,
    items,
    sourceCount:
      typeof raw.sourceCount === "number"
        ? raw.sourceCount
        : new Set(items.map((i) => i.sourceName)).size,
  };
}
