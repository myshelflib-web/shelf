import type { Prisma } from "@prisma/client";
import { parseGeneratedArticle, parseRelevanceReview } from "./parseArticle.js";
import type { GeneratedArticle, RelevanceReview } from "./types.js";

export type StarterDraft = {
  article: GeneratedArticle;
  review: RelevanceReview;
};

/** Stored on SKIPPED items so Retry can revise the same page instead of redrafting. */
export function packStarterDraft(
  article: GeneratedArticle,
  review: RelevanceReview
): Prisma.InputJsonValue {
  return {
    v: 1,
    kind: "STARTER_DRAFT",
    article,
    review,
  } as Prisma.InputJsonValue;
}

export function parseStarterDraft(value: unknown): StarterDraft | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const article = parseGeneratedArticle(JSON.stringify(raw.article ?? null));
  const review = parseRelevanceReview(JSON.stringify(raw.review ?? null));
  if (!article || !review) return null;
  return { article, review };
}
