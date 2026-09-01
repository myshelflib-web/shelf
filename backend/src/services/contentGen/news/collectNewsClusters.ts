import type { StudyGoal } from "@prisma/client";
import prisma from "../../../utils/prisma.js";
import type { NewsCluster, NewsSourceItem } from "./newsTypes.js";

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "will", "has", "have",
  "was", "were", "are", "its", "into", "over", "after", "under", "new", "says",
  "said", "india", "indian", "government", "minister", "ministry", "national",
  "report", "launch", "launches", "announced", "announces", "scheme", "state",
  "states", "union", "council", "committee", "day", "year", "years",
]);

function keywords(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w))
  );
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const word of a) if (b.has(word)) shared += 1;
  return shared / Math.min(a.size, b.size);
}

function slugSeed(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Pulls recently ingested items for a goal. Only Shelf-written summaries and
 * licence-permitted excerpts are read — never full third-party article bodies.
 */
export async function loadRecentNewsItems(
  studyGoal: StudyGoal,
  windowDays: number,
  max: number
): Promise<NewsSourceItem[]> {
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const rows = await prisma.ingestItem.findMany({
    where: {
      studyGoals: { has: studyGoal },
      status: { in: ["FETCHED", "PENDING_REVIEW", "APPROVED", "PUBLISHED"] },
      OR: [{ publishedAt: { gte: since } }, { fetchedAt: { gte: since } }],
    },
    orderBy: [{ publishedAt: "desc" }, { fetchedAt: "desc" }],
    take: Math.min(400, Math.max(10, max)),
    select: {
      id: true,
      title: true,
      canonicalUrl: true,
      publishedAt: true,
      shelfSummary: true,
      factualExcerpt: true,
      tags: true,
      source: { select: { name: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    canonicalUrl: row.canonicalUrl,
    sourceName: row.source.name,
    publishedAt: row.publishedAt,
    summary: row.shelfSummary ?? "",
    excerpt: row.factualExcerpt ?? "",
    tags: row.tags,
  }));
}

/**
 * Greedy title-keyword clustering. Clusters carrying two or more publishers are
 * ranked first: corroboration across sources is what lets the brief be written
 * as original synthesis rather than a restatement of one outlet.
 */
export function clusterNewsItems(
  items: NewsSourceItem[],
  opts: { minOverlap?: number; maxPerCluster?: number } = {}
): NewsCluster[] {
  const minOverlap = opts.minOverlap ?? 0.34;
  const maxPerCluster = opts.maxPerCluster ?? 5;

  const buckets: { keys: Set<string>; items: NewsSourceItem[] }[] = [];

  for (const item of items) {
    const words = keywords(item.title);
    if (words.size === 0) continue;

    const match = buckets.find(
      (b) => b.items.length < maxPerCluster && overlapScore(words, b.keys) >= minOverlap
    );

    if (match) {
      match.items.push(item);
      for (const word of words) match.keys.add(word);
    } else {
      buckets.push({ keys: words, items: [item] });
    }
  }

  return buckets
    .map((bucket) => ({
      key: slugSeed(bucket.items[0].title),
      leadTitle: bucket.items[0].title,
      items: bucket.items,
      sourceCount: new Set(bucket.items.map((i) => i.sourceName)).size,
    }))
    .filter((cluster) => cluster.key.length > 0)
    .sort((a, b) => {
      if (b.sourceCount !== a.sourceCount) return b.sourceCount - a.sourceCount;
      return b.items.length - a.items.length;
    });
}
