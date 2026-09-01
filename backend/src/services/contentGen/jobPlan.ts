import type { Prisma } from "@prisma/client";
import type { NewsCluster } from "./news/newsTypes.js";

export type StarterPlanEntry = {
  subjectSlug: string;
  topicSlug: string;
  slug: string;
  title: string;
};

export type StarterJobPlan = {
  v: 1;
  kind: "STARTER_PACK";
  entries: StarterPlanEntry[];
};

export type NewsJobPlan = {
  v: 1;
  kind: "NEWS_BRIEF";
  topicSlug: string;
  topicTitle: string;
  clusters: NewsCluster[];
};

export type ContentGenPlan = StarterJobPlan | NewsJobPlan;

export function asStarterPlan(value: unknown): StarterJobPlan | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as StarterJobPlan;
  if (raw.kind !== "STARTER_PACK" || !Array.isArray(raw.entries)) return null;
  return raw;
}

export function asNewsPlan(value: unknown): NewsJobPlan | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as NewsJobPlan;
  if (raw.kind !== "NEWS_BRIEF" || !Array.isArray(raw.clusters)) return null;
  return raw;
}

export function planJson(plan: ContentGenPlan): Prisma.InputJsonValue {
  return plan as unknown as Prisma.InputJsonValue;
}

export function uniqueStarterEntries(
  rows: Array<{
    title: string;
    slug: string;
    subjectSlug: string;
    topicSlug: string;
  }>
): StarterPlanEntry[] {
  const seen = new Set<string>();
  const entries: StarterPlanEntry[] = [];
  for (const row of rows) {
    const key = `${row.subjectSlug}/${row.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({
      subjectSlug: row.subjectSlug,
      topicSlug: row.topicSlug,
      slug: row.slug,
      title: row.title,
    });
  }
  return entries;
}
