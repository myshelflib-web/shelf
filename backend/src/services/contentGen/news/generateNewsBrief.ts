import { logger } from "../../../utils/logger.js";
import {
  addUsage,
  emptyUsage,
  generationChat,
  type GenerationUsage,
} from "../generationChat.js";
import { asString, asStringArray, parseJsonObject } from "../jsonExtract.js";
import {
  newsBriefMessages,
  newsReviewMessages,
  newsReviseMessages,
} from "./newsPrompts.js";
import type { NewsBrief, NewsCluster, NewsReview } from "./newsTypes.js";

export const MIN_NEWS_SCORE = 75;

export function parseNewsBrief(raw: string): NewsBrief | null {
  const obj = parseJsonObject<Record<string, unknown>>(raw);
  if (!obj) return null;

  const brief: NewsBrief = {
    title: asString(obj.title),
    metaDescription: asString(obj.metaDescription).slice(0, 300),
    whatHappened: asStringArray(obj.whatHappened, 6),
    whyItMatters: asStringArray(obj.whyItMatters, 6),
    keyFacts: asStringArray(obj.keyFacts, 8),
    syllabusLinks: asStringArray(obj.syllabusLinks, 6),
    prelimsPointers: asStringArray(obj.prelimsPointers, 6),
    mainsAngle: asStringArray(obj.mainsAngle, 5),
    keywords: asStringArray(obj.keywords, 10),
  };

  // The prompt returns an empty object when the sources are too thin to use.
  if (!brief.title || brief.whatHappened.length === 0) return null;
  return brief;
}

function parseNewsReview(raw: string): NewsReview | null {
  const obj = parseJsonObject<Record<string, unknown>>(raw);
  if (!obj) return null;

  const scoreRaw = Number(obj.score);
  const score = Number.isFinite(scoreRaw)
    ? Math.max(0, Math.min(100, Math.round(scoreRaw)))
    : 0;
  const unsupported = asStringArray(obj.unsupported, 10);
  const copiedPhrases = asStringArray(obj.copiedPhrases, 10);
  const pass =
    asString(obj.verdict).toLowerCase() === "pass" &&
    score >= 85 &&
    unsupported.length === 0 &&
    copiedPhrases.length === 0;

  return { score, unsupported, copiedPhrases, verdict: pass ? "pass" : "revise" };
}

export type NewsBriefResult = {
  brief: NewsBrief;
  review: NewsReview;
  usage: GenerationUsage;
  revisions: number;
};

/**
 * Synthesise one brief from a multi-source cluster, then audit it for
 * unsupported claims and copied phrasing, then revise once if needed.
 */
export async function generateNewsBrief(
  cluster: NewsCluster,
  examContext: string,
  examLabel: string
): Promise<NewsBriefResult> {
  let usage = emptyUsage();

  const drafted = await generationChat(
    newsBriefMessages(cluster, examContext, examLabel),
    { maxTokens: 3200, temperature: 0.3, metricsFlow: "content_gen_news", reasoningEffort: null }
  );
  usage = addUsage(usage, drafted);

  let brief = parseNewsBrief(drafted.text);
  if (!brief) {
    const retried = await generationChat(
      newsBriefMessages(cluster, examContext, examLabel),
      {
        maxTokens: 4096,
        temperature: 0.3,
        metricsFlow: "content_gen_news",
        reasoningEffort: "medium",
      }
    );
    usage = addUsage(usage, retried);
    brief = parseNewsBrief(retried.text);
  }
  if (!brief) throw new Error("Sources were too thin to write an accurate brief");

  const runReview = async (current: NewsBrief) => {
    const res = await generationChat(
      newsReviewMessages(cluster, current, examLabel),
      { maxTokens: 1500, temperature: 0.1, metricsFlow: "content_gen_news_review", reasoningEffort: null }
    );
    usage = addUsage(usage, res);
    return (
      parseNewsReview(res.text) ?? {
        score: 0,
        unsupported: [],
        copiedPhrases: [],
        verdict: "revise" as const,
      }
    );
  };

  let review = await runReview(brief);
  let revisions = 0;

  if (review.verdict === "revise") {
    const res = await generationChat(
      newsReviseMessages(cluster, brief, review, examLabel),
      { maxTokens: 4096, temperature: 0.2, metricsFlow: "content_gen_news_revise", reasoningEffort: "medium" }
    );
    usage = addUsage(usage, res);
    revisions = 1;

    const revised = parseNewsBrief(res.text);
    if (revised) {
      brief = revised;
      review = await runReview(brief);
    } else {
      logger.warn("contentgen.news.revise_unparseable", { key: cluster.key });
    }
  }

  return { brief, review, usage, revisions };
}
