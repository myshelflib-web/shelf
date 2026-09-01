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
const DRAFT_MAX_TOKENS = 8192;
const DRAFT_THINK_MAX_TOKENS = 12_288;
const RECHECK_MAX_TOKENS = 2048;

async function draftOnce(
  blueprint: StarterPackBlueprint,
  spec: ResolvedArticleSpec
): Promise<{ article: GeneratedArticle; usage: GenerationUsage }> {
  let usage = emptyUsage();

  for (let attempt = 1; attempt <= 2; attempt++) {
    const think = attempt > 1;
    const res = await generationChat(draftMessages(blueprint, spec), {
      maxTokens: think ? DRAFT_THINK_MAX_TOKENS : DRAFT_MAX_TOKENS,
      temperature: 0.35,
      metricsFlow: "content_gen_draft",
      reasoningEffort: think ? "medium" : null,
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
  article: GeneratedArticle
): Promise<{ review: RelevanceReview; usage: GenerationUsage }> {
  const res = await generationChat(recheckMessages(blueprint, spec, article), {
    maxTokens: RECHECK_MAX_TOKENS,
    temperature: 0.1,
    metricsFlow: "content_gen_recheck",
    reasoningEffort: null,
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

/**
 * Draft, then audit against the syllabus checklist, then revise once if the
 * audit flags gaps or factual risk. The final review score is what the admin
 * dashboard shows and what gates publishing.
 */
export async function generateStarterArticle(
  blueprint: StarterPackBlueprint,
  spec: ResolvedArticleSpec,
  opts: { maxRevisions?: number } = {}
): Promise<StarterArticleResult> {
  const maxRevisions = opts.maxRevisions ?? 2;

  const drafted = await draftOnce(blueprint, spec);
  let article = drafted.article;
  let usage = drafted.usage;

  let reviewed = await reviewDraft(blueprint, spec, article);
  usage = addUsage(usage, reviewed.usage);
  let review = reviewed.review;
  let revisions = 0;

  while (review.verdict === "revise" && revisions < maxRevisions) {
    const res = await generationChat(
      reviseMessages(blueprint, spec, article, review),
      {
        maxTokens: DRAFT_THINK_MAX_TOKENS,
        temperature: 0.25,
        metricsFlow: "content_gen_revise",
        reasoningEffort: "medium",
      }
    );
    usage = addUsage(usage, res);
    revisions += 1;

    const revised = parseGeneratedArticle(res.text);
    if (!revised) {
      logger.warn("contentgen.revise.unparseable", { slug: spec.slug });
      break;
    }
    article = revised;

    reviewed = await reviewDraft(blueprint, spec, article);
    usage = addUsage(usage, reviewed.usage);
    review = reviewed.review;
  }

  // Keep the blueprint keywords even if the model dropped some.
  article.keywords = [...new Set([...spec.keywords, ...article.keywords])].slice(0, 12);

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
