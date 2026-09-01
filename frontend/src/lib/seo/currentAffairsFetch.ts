const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

const FETCH_MS = 8_000;

export type CurrentAffairsPublicItem = {
  slug: string;
  title: string;
  canonicalUrl: string;
  shelfSummary: string | null;
  factualExcerpt: string | null;
  license: string;
  tags: string[];
  studyGoals: string[];
  edition: string | null;
  publishedAt: string | null;
  publishedAtShelf: string | null;
  sharePath: string;
  learnPath: string | null;
  disclaimer: string;
  linkStatus: string;
  embeddable: boolean | null;
  source: { name: string; slug: string };
};

export async function fetchCurrentAffairsItem(
  slug: string
): Promise<CurrentAffairsPublicItem | null> {
  try {
    const res = await fetch(
      `${API_URL}/api/current-affairs/items/${encodeURIComponent(slug)}`,
      { next: { revalidate: 900 }, signal: AbortSignal.timeout(FETCH_MS) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { item?: CurrentAffairsPublicItem };
    return data.item ?? null;
  } catch {
    return null;
  }
}

export async function fetchCurrentAffairsFeed(
  goal = "UPSC",
  limit = 8
): Promise<CurrentAffairsPublicItem[]> {
  try {
    const params = new URLSearchParams({ goal, limit: String(limit) });
    const res = await fetch(`${API_URL}/api/current-affairs?${params}`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(FETCH_MS),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: CurrentAffairsPublicItem[] };
    return data.items ?? [];
  } catch {
    return [];
  }
}

export async function fetchCurrentAffairsSitemapSlugs(
  siteUrl: string
): Promise<
  Array<{ url: string; lastModified?: string; changeFrequency: "daily"; priority: number }>
> {
  try {
    const res = await fetch(`${API_URL}/api/current-affairs/sitemap-slugs`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(FETCH_MS),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      items?: Array<{ slug: string; lastModified?: string }>;
    };
    return (data.items ?? []).map((item) => ({
      url: `${siteUrl}/learn/current-affairs/${item.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.82,
      ...(item.lastModified
        ? { lastModified: new Date(item.lastModified).toISOString() }
        : {}),
    }));
  } catch {
    return [];
  }
}
