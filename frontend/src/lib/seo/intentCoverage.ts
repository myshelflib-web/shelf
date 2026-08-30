/**
 * Search-intent coverage helpers for Shelf SEO.
 * Data lives in intentClusters.ts (≤500 lines).
 */
export type { IntentCluster } from "./intentClusters";
export { INTENT_CLUSTERS } from "./intentClusters";
import { INTENT_CLUSTERS } from "./intentClusters";

/** Exam curriculum intents — only surface on /learn and track pages. */
export const EXAM_CURRICULUM_INTENT_IDS = new Set([
  "gate-syllabus",
  "upsc-syllabus",
  "state-pcs",
  "judiciary",
  "ca-syllabus",
  "neet-pg",
  "learn-hub",
]);

/** Product / audience intents for generic landing (home, features). */
export const PRODUCT_INTENT_CLUSTERS = INTENT_CLUSTERS.filter(
  (c) => !EXAM_CURRICULUM_INTENT_IDS.has(c.id)
);

/** Flat unique queries for meta keyword merges (capped). */
export function allIntentQueries(limit = 40): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const cluster of PRODUCT_INTENT_CLUSTERS) {
    for (const q of cluster.queries) {
      const key = q.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(q);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

export function intentFaqs(
  clusters = PRODUCT_INTENT_CLUSTERS
): Array<{ question: string; answer: string }> {
  return clusters.map((c) => ({
    question: `Does Shelf help with ${c.label.toLowerCase()}?`,
    answer: `${c.answer} Learn more at ${c.path}.`,
  }));
}

/** Homepage FAQ — product intents only (no named exams). */
export const HOME_INTENT_FAQ_IDS = [
  "personal-library",
  "study-ai",
  "share-shelf",
  "teachers",
  "exam-quiz",
  "youtube-lectures",
  "telegram",
  "pdf-highlights",
  "planner",
  "offline",
  "privacy",
] as const;

export function homeIntentFaqs(): Array<{ question: string; answer: string }> {
  const byId = new Map(INTENT_CLUSTERS.map((c) => [c.id, c]));
  const faqs: Array<{ question: string; answer: string }> = [];
  for (const id of HOME_INTENT_FAQ_IDS) {
    const c = byId.get(id);
    if (!c) continue;
    faqs.push({
      question: `Can Shelf help with ${c.label.toLowerCase()}?`,
      answer: `${c.answer} See ${c.path}.`,
    });
  }
  faqs.push({
    question: "Is there a free plan?",
    answer:
      "Yes. Free accounts include private PDF storage, highlights, Share Shelf, Study AI with monthly limits, planner, and access to public Learn curriculum. Premium adds more storage, tokens, and Deep Study AI mode.",
  });
  return faqs;
}
