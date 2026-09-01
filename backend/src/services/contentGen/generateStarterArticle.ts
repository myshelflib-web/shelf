import { logger } from "../../utils/logger.js";
import {
  addUsage,
  emptyUsage,
  generationChat,
  type GenerationUsage,
} from "./generationChat.js";
import { articleWordCount, parseGeneratedArticle, parseRelevanceReview } from "./parseArticle.js";
import {
  draftMessages,
  recheckMessages,
  reviseMessages,
} from "./prompts/starterPrompts.js";
import type {
  GeneratedArticle,
  RelevanceReview,
  ResolvedArticleSpec,
  StarterPackBlueprint,
} from "./types.js";

/** Below this the page is not published — it goes back as a failed item instead. */
export const MIN_PUBLISH_SCORE = 70;

export type StarterArticleResult = {
  article: GeneratedArticle;
  review: RelevanceReview;
  usage: GenerationUsage;
  wordCount: number;
  revisions: number;
};

/** First pass without thinking; think only if the JSON draft does not parse. */
const DRAFT_MAX_TOKENS = 12_288;
const RECHECK_MAX_TOKENS = 4096;

async function draftOnce(
  blueprint: StarterPackBlueprint,
  spec: ResolvedArticleSpec,
  signal?: AbortSignal
): Promise<{ article: GeneratedArticle; usage: GenerationUsage }> {
  let usage = emptyUsage();

  for (let attempt = 1; attempt <= 2; attempt++) {
    const think = attempt > 1;
    const res = await generationChat(draftMessages(blueprint, spec), {
      maxTokens: DRAFT_MAX_TOKENS,
      temperature: 0.35,
      metricsFlow: "content_gen_draft",
      reasoningEffort: think ? "medium" : null,
      signal,
    });
    usage = addUsage(usage, res);

    const parsed = parseGeneratedArticle(res.text);
    if (parsed) return { article: parsed, usage };

    logger.warn("contentgen.draft.unparseable", { slug: spec.slug, attempt });
  }

  throw new Error("Model did not return a usable article draft");
}

async function reviewDraft(
  blueprint: StarterPackBlueprint,
  spec: ResolvedArticleSpec,
  article: GeneratedArticle,
  signal?: AbortSignal
): Promise<{ review: RelevanceReview; usage: GenerationUsage }> {
  const res = await generationChat(recheckMessages(blueprint, spec, article), {
    maxTokens: RECHECK_MAX_TOKENS,
    temperature: 0.1,
    metricsFlow: "content_gen_recheck",
    reasoningEffort: null,
    signal,
  });

  const parsed = parseRelevanceReview(res.text);
  const review: RelevanceReview = parsed ?? {
    score: 0,
    missing: [],
    corrections: ["Reviewer response could not be parsed"],
    vague: [],
    verdict: "revise",
  };

  return { review, usage: { inputTokens: res.inputTokens, outputTokens: res.outputTokens } };
}

async function reviseOnce(
  blueprint: StarterPackBlueprint,
  spec: ResolvedArticleSpec,
  article: GeneratedArticle,
  review: RelevanceReview,
  signal?: AbortSignal
): Promise<{ article: GeneratedArticle | null; usage: GenerationUsage }> {
  const res = await generationChat(
    reviseMessages(blueprint, spec, article, review),
    {
      maxTokens: DRAFT_MAX_TOKENS,
      temperature: 0.25,
      metricsFlow: "content_gen_revise",
      reasoningEffort: "medium",
      signal,
    }
  );
  const parsed = parseGeneratedArticle(res.text);
  if (!parsed) {
    logger.warn("contentgen.revise.unparseable", { slug: spec.slug });
  }
  return {
    article: parsed,
    usage: { inputTokens: res.inputTokens, outputTokens: res.outputTokens },
  };
}

function withKeywords(
  spec: ResolvedArticleSpec,
  article: GeneratedArticle
): GeneratedArticle {
  return {
    ...article,
    keywords: [...new Set([...spec.keywords, ...article.keywords])].slice(0, 12),
  };
}

/**
 * Draft, then audit against the syllabus checklist, then revise once if the
 * audit flags gaps or factual risk. The final review score is what the admin
 * dashboard shows and what gates publishing.
 */
export async function generateStarterArticle(
  blueprint: StarterPackBlueprint,
  spec: ResolvedArticleSpec,
  opts: { maxRevisions?: number; signal?: AbortSignal } = {}
): Promise<StarterArticleResult> {
  const maxRevisions = opts.maxRevisions ?? 2;
  const signal = opts.signal;

  const drafted = await draftOnce(blueprint, spec, signal);
  let article = drafted.article;
  let usage = drafted.usage;

  let reviewed = await reviewDraft(blueprint, spec, article, signal);
  usage = addUsage(usage, reviewed.usage);
  let review = reviewed.review;
  let revisions = 0;

  while (review.verdict === "revise" && revisions < maxRevisions) {
    const revised = await reviseOnce(blueprint, spec, article, review, signal);
    usage = addUsage(usage, revised.usage);
    revisions += 1;
    if (!revised.article) break;
    article = revised.article;

    reviewed = await reviewDraft(blueprint, spec, article, signal);
    usage = addUsage(usage, reviewed.usage);
    review = reviewed.review;
  }

  article = withKeywords(spec, article);

  logger.info("contentgen.article.generated", {
    slug: spec.slug,
    score: review.score,
    revisions,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
  });

  return {
    article,
    review,
    usage,
    wordCount: articleWordCount(article),
    revisions,
  };
}

/**
 * One or two revise+recheck cycles from a held draft, using the last review
 * notes. Cheaper than a full redraft when Retry failed picks up a SKIPPED page.
 */
export async function improveStarterArticle(
  blueprint: StarterPackBlueprint,
  spec: ResolvedArticleSpec,
  article: GeneratedArticle,
  review: RelevanceReview,
  opts: { maxRevisions?: number; signal?: AbortSignal } = {}
): Promise<StarterArticleResult> {
  const maxRevisions = opts.maxRevisions ?? 2;
  const signal = opts.signal;
  let usage = emptyUsage();
  let current = article;
  let currentReview = review;
  let revisions = 0;

  const needsWork =
    currentReview.verdict === "revise" || currentReview.score < MIN_PUBLISH_SCORE;

  while (needsWork && revisions < maxRevisions) {
    const revised = await reviseOnce(
      blueprint,
      spec,
      current,
      currentReview,
      signal
    );
    usage = addUsage(usage, revised.usage);
    revisions += 1;
    if (!revised.article) break;
    current = revised.article;

    const reviewed = await reviewDraft(blueprint, spec, current, signal);
    usage = addUsage(usage, reviewed.usage);
    currentReview = reviewed.review;
    if (currentReview.score >= MIN_PUBLISH_SCORE) break;
  }

  current = withKeywords(spec, current);

  logger.info("contentgen.article.improved", {
    slug: spec.slug,
    score: currentReview.score,
    revisions,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
  });

  return {
    article: current,
    review: currentReview,
    usage,
    wordCount: articleWordCount(current),
    revisions,
  };
}
