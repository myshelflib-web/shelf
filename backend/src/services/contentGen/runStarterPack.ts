import type { StudyGoal } from "@prisma/client";
import prisma from "../../utils/prisma.js";
import { errorFields, logger } from "../../utils/logger.js";
import { blueprintForGoal } from "./blueprints/index.js";
import { specForPage, specsForGoal } from "./syllabus/index.js";
import {
  createContentGenJob,
  finishJob,
  getJobRunState,
  markJobRunning,
  pendingItems,
  recordItemOutcome,
  skipOpenContentGenItems,
} from "./contentGenJobs.js";
import { asStarterPlan, type StarterPlanEntry } from "./jobPlan.js";
import { generationModelLabel } from "./generationChat.js";
import {
  generateStarterArticle,
  improveStarterArticle,
  MIN_PUBLISH_SCORE,
} from "./generateStarterArticle.js";
import { packStarterDraft, parseStarterDraft, type StarterDraft } from "./starterDraft.js";
import { runJobLoop, type LoopItem } from "./jobLoop.js";
import { claimJob, jobAbortSignal, releaseJob } from "./jobRegistry.js";
import { STOPPED_BY_ADMIN } from "./stopJob.js";
import { publishGeneratedArticle } from "./publishGenerated.js";
import { renderArticleHtml, renderArticleText } from "./renderArticle.js";
import type { ItemOutcome } from "./contentGenJobs.js";
import type { ResolvedArticleSpec } from "./types.js";

export type StartStarterPackInput = {
  studyGoal: StudyGoal;
  /** Generate only this subject's pages (exam → subject). */
  subjectSlug?: string;
  /** Cap how many pages this run generates (cost control). */
  limit?: number;
  /** Generate and score without writing Articles or S3 objects. */
  dryRun?: boolean;
  /** Skip specs that already have a published Article. */
  skipExisting?: boolean;
  requestedById?: string | null;
};

/** One query for the whole pack instead of one findFirst per leaf. */
async function unpublishedSpecs(
  specs: ResolvedArticleSpec[]
): Promise<ResolvedArticleSpec[]> {
  if (specs.length === 0) return specs;
  const published = await prisma.article.findMany({
    where: {
      slug: { in: [...new Set(specs.map((s) => s.slug))] },
      status: "PUBLISHED",
      contentUrl: { not: null },
    },
    select: {
      slug: true,
      topic: { select: { slug: true, subject: { select: { slug: true } } } },
    },
  });
  const keys = new Set(
    published.map((a) => `${a.topic.subject.slug}/${a.topic.slug}/${a.slug}`)
  );
  return specs.filter(
    (s) => !keys.has(`${s.subjectSlug}/${s.topicSlug}/${s.slug}`)
  );
}

function reviewNotes(
  missing: string[],
  corrections: string[],
  vague: string[]
): string | null {
  const lines = [
    ...missing.map((m) => `Missing: ${m}`),
    ...corrections.map((c) => `Correction: ${c}`),
    ...vague.map((v) => `Vague: ${v}`),
  ];
  return lines.length ? lines.join("\n") : null;
}

/** Creates the job row and returns immediately; generation runs in the background. */
export async function startStarterPackJob(
  input: StartStarterPackInput
): Promise<{ jobId: string; plannedCount: number }> {
  const blueprint = blueprintForGoal(input.studyGoal);
  if (!blueprint) throw new Error(`No starter pack blueprint for ${input.studyGoal}`);

  let specs = specsForGoal(input.studyGoal, {
    subjectSlug: input.subjectSlug,
  });
  if (input.skipExisting) {
    specs = await unpublishedSpecs(specs);
  }
  if (input.limit && input.limit > 0) specs = specs.slice(0, input.limit);

  if (specs.length === 0) {
    throw new Error("Nothing to generate — every page in this pack is already published");
  }

  const jobId = await createContentGenJob({
    kind: "STARTER_PACK",
    studyGoal: input.studyGoal,
    model: generationModelLabel(),
    dryRun: Boolean(input.dryRun),
    plannedCount: specs.length,
    requestedById: input.requestedById,
    plan: {
      v: 1,
      kind: "STARTER_PACK",
      entries: specs.map((s) => ({
        subjectSlug: s.subjectSlug,
        topicSlug: s.topicSlug,
        slug: s.slug,
        title: s.title,
      })),
    },
  });

  void runStarterPackJob(jobId, input.studyGoal, Boolean(input.dryRun)).catch(
    (err) => {
      logger.error("contentgen.starter_pack.crashed", { jobId, ...errorFields(err) });
    }
  );

  return { jobId, plannedCount: specs.length };
}

async function generateOne(
  studyGoal: StudyGoal,
  spec: ResolvedArticleSpec,
  dryRun: boolean,
  signal?: AbortSignal,
  draft?: StarterDraft
): Promise<ItemOutcome> {
  const blueprint = blueprintForGoal(studyGoal);
  if (!blueprint) throw new Error(`No starter pack blueprint for ${studyGoal}`);

  const result = draft
    ? await improveStarterArticle(blueprint, spec, draft.article, draft.review, {
        signal,
      })
    : await generateStarterArticle(blueprint, spec, { signal });
  if (signal?.aborted) {
    const err = new Error("This operation was aborted");
    err.name = "AbortError";
    throw err;
  }
  const notes = reviewNotes(
    result.review.missing,
    result.review.corrections,
    result.review.vague
  );

  if (result.review.score < MIN_PUBLISH_SCORE) {
    return {
      status: "SKIPPED",
      relevanceScore: result.review.score,
      reviewNotes: notes,
      wordCount: result.wordCount,
      ...result.usage,
      payload: packStarterDraft(result.article, result.review),
      error: `Relevance score ${result.review.score} is below the ${MIN_PUBLISH_SCORE} publish threshold`,
    };
  }

  if (dryRun) {
    return {
      status: "COMPLETED",
      relevanceScore: result.review.score,
      reviewNotes: notes,
      wordCount: result.wordCount,
      ...result.usage,
    };
  }

  const published = await publishGeneratedArticle({
    studyGoal,
    subjectSlug: spec.subjectSlug,
    subjectName: spec.subjectName,
    subjectDescription: spec.subjectDescription,
    topicSlug: spec.topicSlug,
    topicTitle: spec.topicTitle,
    slug: spec.slug,
    title: result.article.title,
    summary: result.article.metaDescription,
    html: renderArticleHtml(result.article, spec),
    text: renderArticleText(result.article, spec),
    order: spec.order ?? 0,
  });

  return {
    status: "COMPLETED",
    relevanceScore: result.review.score,
    reviewNotes: notes,
    articleId: published.articleId,
    wordCount: result.wordCount,
    ...result.usage,
  };
}

/**
 * Runs (or continues) a starter pack job from whatever is still QUEUED, so the
 * same entry point serves a fresh start, a manual resume and a startup resume.
 */
export async function runStarterPackJob(
  jobId: string,
  studyGoal: StudyGoal,
  dryRun: boolean,
  startPauseCount = 0
): Promise<void> {
  if (!claimJob(jobId)) return;

  try {
    const state = await getJobRunState(jobId);
    if (
      !state ||
      (state.status !== "QUEUED" &&
        state.status !== "RUNNING" &&
        state.status !== "PAUSED")
    ) {
      return;
    }
    await markJobRunning(jobId);

    const leftover = await pendingItems(jobId);
    const plan = asStarterPlan(state.plan);
    const planDrafts = new Map(
      (plan?.entries ?? []).map((entry) => [
        `${entry.subjectSlug}/${entry.slug}`,
        entry.draft,
      ])
    );

    const items: LoopItem<StarterPlanEntry>[] = [];
    const leftoverKeys = new Set<string>();
    for (const row of leftover) {
      const key = `${row.subjectSlug}/${row.slug}`;
      leftoverKeys.add(key);
      if (specForPage(studyGoal, row.subjectSlug, row.slug)) {
        items.push({
          itemId: row.id,
          spec: {
            subjectSlug: row.subjectSlug,
            topicSlug: row.topicSlug,
            slug: row.slug,
            title: row.title,
            draft: parseStarterDraft(row.payload) ?? planDrafts.get(key),
          },
        });
      } else {
        await recordItemOutcome(jobId, row.id, {
          status: "SKIPPED",
          error: "Page is no longer in the syllabus catalog",
        });
      }
    }

    if (plan) {
      for (const entry of plan.entries.slice(state?.cursor ?? 0)) {
        const key = `${entry.subjectSlug}/${entry.slug}`;
        if (leftoverKeys.has(key)) continue;
        items.push({ spec: entry });
      }
    }

    const result = await runJobLoop({
      jobId,
      label: `starter_pack:${studyGoal}`,
      items,
      startPauseCount,
      describe: (entry) => ({
        title: entry.title,
        slug: entry.slug,
        subjectSlug: entry.subjectSlug,
        topicSlug: entry.topicSlug,
      }),
      process: async (entry) => {
        const spec = specForPage(studyGoal, entry.subjectSlug, entry.slug);
        if (!spec) {
          return {
            status: "SKIPPED",
            error: "Page is no longer in the syllabus catalog",
          };
        }
        return generateOne(
          studyGoal,
          spec,
          dryRun,
          jobAbortSignal(jobId),
          entry.draft
        );
      },
    });

    if (result.status === "PAUSED") {
      logger.warn("contentgen.starter_pack.parked", { jobId, goal: studyGoal });
      return;
    }

    if (result.error === STOPPED_BY_ADMIN) {
      await skipOpenContentGenItems(jobId, STOPPED_BY_ADMIN);
    }

    await finishJob(jobId, { status: result.status, error: result.error ?? null });
    logger.info("contentgen.starter_pack.done", {
      jobId,
      goal: studyGoal,
      status: result.status,
    });
  } finally {
    releaseJob(jobId);
  }
}
