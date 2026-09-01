import type { Prisma } from "@prisma/client";
import type { NewsCluster } from "./news/newsTypes.js";
import { parseStarterDraft, type StarterDraft } from "./starterDraft.js";

export type StarterPlanEntry = {
  subjectSlug: string;
  topicSlug: string;
  slug: string;
  title: string;
  /** Last draft when Retry is improving a below-score page. */
  draft?: StarterDraft;
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
  return {
    v: 1,
    kind: "STARTER_PACK",
    entries: raw.entries.map((entry) => ({
      subjectSlug: entry.subjectSlug,
      topicSlug: entry.topicSlug,
      slug: entry.slug,
      title: entry.title,
      draft: parseStarterDraft(entry.draft) ?? undefined,
    })),
  };
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
    payload?: unknown;
  }>
): StarterPlanEntry[] {
  const seen = new Set<string>();
  const entries: StarterPlanEntry[] = [];
  for (const row of rows) {
    const key = `${row.subjectSlug}/${row.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const draft = parseStarterDraft(row.payload) ?? undefined;
    entries.push({
      subjectSlug: row.subjectSlug,
      topicSlug: row.topicSlug,
      slug: row.slug,
      title: row.title,
      draft,
    });
  }
  return entries;
}
