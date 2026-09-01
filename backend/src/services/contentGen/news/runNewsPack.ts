import type { StudyGoal } from "@prisma/client";
import { errorFields, logger } from "../../../utils/logger.js";
import { blueprintForGoal } from "../blueprints/index.js";
import {
  createContentGenJob,
  finishJob,
  getJobRunState,
  markJobRunning,
  pendingItems,
  recordItemOutcome,
  skipOpenContentGenItems,
  type ItemOutcome,
} from "../contentGenJobs.js";
import { asNewsPlan } from "../jobPlan.js";
import { generationModelLabel } from "../generationChat.js";
import { runJobLoop, type LoopItem } from "../jobLoop.js";
import { claimJob, jobAbortSignal, releaseJob } from "../jobRegistry.js";
import { STOPPED_BY_ADMIN } from "../stopJob.js";
import { publishGeneratedArticle } from "../publishGenerated.js";
import { clusterNewsItems, loadRecentNewsItems } from "./collectNewsClusters.js";
import { generateNewsBrief, MIN_NEWS_SCORE } from "./generateNewsBrief.js";
import { renderNewsBriefHtml, renderNewsBriefText } from "./renderNewsBrief.js";
import { parseStoredCluster, compactClusterForPlan } from "./newsTypes.js";
import type { NewsCluster } from "./newsTypes.js";

const GOAL_SUBJECT: Record<StudyGoal, { slug: string; name: string }> = {
  GENERAL: { slug: "exam-briefs-general", name: "Current affairs briefs" },
  UPSC: { slug: "exam-briefs-upsc", name: "UPSC current affairs briefs" },
  STATE_PCS: { slug: "exam-briefs-state-pcs", name: "State PCS current affairs briefs" },
  JUDICIARY: { slug: "exam-briefs-judiciary", name: "Judiciary current affairs briefs" },
  CA: { slug: "exam-briefs-ca", name: "CA current affairs briefs" },
  NEET_PG: { slug: "exam-briefs-neet-pg", name: "NEET PG current affairs briefs" },
  GATE: { slug: "exam-briefs-gate", name: "GATE current affairs briefs" },
};

function monthTopic(): { slug: string; title: string } {
  const now = new Date();
  const slug = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const title = now.toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return { slug, title };
}

export type StartNewsPackInput = {
  studyGoal: StudyGoal;
  /** How many briefs to write in this run. */
  limit?: number;
  /** How far back to look across already-scraped items. */
  windowDays?: number;
  /** Require this many distinct publishers per cluster before synthesising. */
  minSources?: number;
  dryRun?: boolean;
  requestedById?: string | null;
};

export type NewsPackPlan = {
  clusters: NewsCluster[];
  totalItems: number;
};

/** Preview what a news run would cover, without spending tokens. */
export async function planNewsPack(input: StartNewsPackInput): Promise<NewsPackPlan> {
  const items = await loadRecentNewsItems(
    input.studyGoal,
    input.windowDays ?? 7,
    300
  );
  const minSources = input.minSources ?? 2;
  const clusters = clusterNewsItems(items)
    .filter((c) => c.sourceCount >= minSources)
    .slice(0, Math.min(25, Math.max(1, input.limit ?? 8)));

  return { clusters, totalItems: items.length };
}

export async function startNewsPackJob(
  input: StartNewsPackInput
): Promise<{ jobId: string; plannedCount: number }> {
  const blueprint = blueprintForGoal(input.studyGoal);
  if (!blueprint) throw new Error(`No exam context for ${input.studyGoal}`);

  const { clusters } = await planNewsPack(input);
  if (clusters.length === 0) {
    throw new Error(
      "No multi-source story clusters found. Poll the ingestion sources first, or lower the minimum source count."
    );
  }

  const topic = monthTopic();

  const jobId = await createContentGenJob({
    kind: "NEWS_BRIEF",
    studyGoal: input.studyGoal,
    model: generationModelLabel(),
    dryRun: Boolean(input.dryRun),
    plannedCount: clusters.length,
    requestedById: input.requestedById,
    plan: {
      v: 1,
      kind: "NEWS_BRIEF",
      topicSlug: topic.slug,
      topicTitle: topic.title,
      clusters: clusters.map(compactClusterForPlan),
    },
  });

  void runNewsPackJob(jobId, input.studyGoal, Boolean(input.dryRun)).catch((err) => {
    logger.error("contentgen.news_pack.crashed", { jobId, ...errorFields(err) });
  });

  return { jobId, plannedCount: clusters.length };
}

async function generateOne(
  studyGoal: StudyGoal,
  cluster: NewsCluster,
  dryRun: boolean,
  topic: { slug: string; title: string },
  signal?: AbortSignal
): Promise<ItemOutcome> {
  const blueprint = blueprintForGoal(studyGoal);
  if (!blueprint) throw new Error(`No exam context for ${studyGoal}`);
  const subject = GOAL_SUBJECT[studyGoal];

  const result = await generateNewsBrief(
    cluster,
    blueprint.examContext,
    blueprint.label,
    { signal }
  );
  if (signal?.aborted) {
    const err = new Error("This operation was aborted");
    err.name = "AbortError";
    throw err;
  }
  const notes =
    [
      ...result.review.unsupported.map((u) => `Unsupported: ${u}`),
      ...result.review.copiedPhrases.map((c) => `Copied phrasing: ${c}`),
    ].join("\n") || null;

  const copied = result.review.copiedPhrases.length > 0;
  if (result.review.score < MIN_NEWS_SCORE || copied) {
    return {
      status: "SKIPPED",
      relevanceScore: result.review.score,
      reviewNotes: notes,
      ...result.usage,
      error: copied
        ? "Held back: reviewer still found copied phrasing"
        : `Held back: score ${result.review.score} is below ${MIN_NEWS_SCORE}`,
    };
  }

  if (dryRun) {
    return {
      status: "COMPLETED",
      relevanceScore: result.review.score,
      reviewNotes: notes,
      ...result.usage,
    };
  }

  const published = await publishGeneratedArticle({
    studyGoal,
    subjectSlug: subject.slug,
    subjectName: subject.name,
    subjectDescription: `Original ${blueprint.label} current-affairs briefs written on Shelf from multiple reported sources.`,
    topicSlug: topic.slug,
    topicTitle: topic.title,
    slug: cluster.key,
    title: result.brief.title,
    summary: result.brief.metaDescription,
    html: renderNewsBriefHtml(result.brief, cluster),
    text: renderNewsBriefText(result.brief, cluster),
  });

  return {
    status: "COMPLETED",
    relevanceScore: result.review.score,
    reviewNotes: notes,
    articleId: published.articleId,
    ...result.usage,
  };
}

/**
 * Runs (or continues) a news job from leftover QUEUED rows, then the remaining
 * clusters on `job.plan`. Clusters live once on the job so a paused run writes
 * the same briefs it originally planned, even though the ingest window moved.
 */
export async function runNewsPackJob(
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
    const plan = asNewsPlan(state.plan);
    const subject = GOAL_SUBJECT[studyGoal];
    const topic = plan
      ? { slug: plan.topicSlug, title: plan.topicTitle }
      : monthTopic();

    const items: LoopItem<NewsCluster>[] = [];
    const leftoverKeys = new Set<string>();
    for (const row of leftover) {
      leftoverKeys.add(row.slug);
      const cluster =
        parseStoredCluster(row.payload) ??
        plan?.clusters.find((c) => c.key === row.slug) ??
        null;
      if (cluster) items.push({ itemId: row.id, spec: cluster });
      else {
        await recordItemOutcome(jobId, row.id, {
          status: "SKIPPED",
          error: "News cluster is no longer on this job plan",
        });
      }
    }

    if (plan) {
      for (const cluster of plan.clusters.slice(state?.cursor ?? 0)) {
        if (leftoverKeys.has(cluster.key)) continue;
        items.push({ spec: cluster });
      }
    }

    const result = await runJobLoop({
      jobId,
      label: `news_pack:${studyGoal}`,
      items,
      startPauseCount,
      describe: (cluster) => ({
        title: cluster.leadTitle.slice(0, 200),
        slug: cluster.key,
        subjectSlug: subject.slug,
        topicSlug: topic.slug,
      }),
      process: (cluster) =>
        generateOne(studyGoal, cluster, dryRun, topic, jobAbortSignal(jobId)),
    });

    if (result.status === "PAUSED") {
      logger.warn("contentgen.news_pack.parked", { jobId, goal: studyGoal });
      return;
    }

    if (result.error === STOPPED_BY_ADMIN) {
      await skipOpenContentGenItems(jobId, STOPPED_BY_ADMIN);
    }

    await finishJob(jobId, { status: result.status, error: result.error ?? null });
    logger.info("contentgen.news_pack.done", {
      jobId,
      goal: studyGoal,
      status: result.status,
    });
  } finally {
    releaseJob(jobId);
  }
}
