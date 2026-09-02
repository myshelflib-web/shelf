import type { StudyGoal } from "@prisma/client";
import prisma from "../../../utils/prisma.js";
import { errorFields, logger } from "../../../utils/logger.js";
import {
  completeJobIfIdle,
  createContentGenJob,
  finishJob,
  getJobRunState,
  markJobRunning,
  pendingItems,
  recordItemOutcome,
  skipOpenContentGenItems,
} from "../contentGenJobs.js";
import { asVisualEnrichPlan } from "../jobPlan.js";
import { generationModelLabel } from "../generationChat.js";
import { runJobLoop, type LoopItem } from "../jobLoop.js";
import { claimJob, isJobAborted, releaseJob } from "../jobRegistry.js";
import { STOPPED_BY_ADMIN } from "../stopJob.js";
import { enrichOnePageVisuals } from "./enrichOnePage.js";
import {
  planVisualEnrichArticles,
  type VisualEnrichPlanEntry,
} from "./planVisualEnrich.js";

export type StartVisualEnrichInput = {
  studyGoal: StudyGoal;
  subjectSlug?: string;
  limit?: number;
  dryRun?: boolean;
  requestedById?: string | null;
};

function apiPublicBase(): string {
  const env = process.env.API_PUBLIC_URL?.replace(/\/$/, "");
  return env ?? "http://localhost:4000";
}

export async function startVisualEnrichJob(
  input: StartVisualEnrichInput
): Promise<{ jobId: string; plannedCount: number }> {
  const entries = await planVisualEnrichArticles({
    studyGoal: input.studyGoal,
    subjectSlug: input.subjectSlug,
    limit: input.limit,
  });

  if (entries.length === 0) {
    throw new Error(
      "No published generated pages found for this goal — generate text first"
    );
  }

  const jobId = await createContentGenJob({
    kind: "VISUAL_ENRICH",
    studyGoal: input.studyGoal,
    model: generationModelLabel(),
    dryRun: Boolean(input.dryRun),
    withIllustrations: true,
    plannedCount: entries.length,
    requestedById: input.requestedById,
    plan: {
      v: 1,
      kind: "VISUAL_ENRICH",
      entries: entries.map((e) => ({
        articleId: e.articleId,
        subjectSlug: e.subjectSlug,
        topicSlug: e.topicSlug,
        slug: e.slug,
        title: e.title,
        contentUrl: e.contentUrl,
      })),
    },
  });

  void runVisualEnrichJob(jobId, input.studyGoal, Boolean(input.dryRun)).catch(
    (err) => {
      logger.error("contentgen.visual_enrich.crashed", {
        jobId,
        ...errorFields(err),
      });
    }
  );

  return { jobId, plannedCount: entries.length };
}

export async function runVisualEnrichJob(
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
    if (await completeJobIfIdle(jobId)) return;
    await markJobRunning(jobId);

    const leftover = await pendingItems(jobId);
    const plan = asVisualEnrichPlan(state.plan);
    const items: LoopItem<VisualEnrichPlanEntry>[] = [];

    for (const row of leftover) {
      const entry = plan?.entries.find(
        (e) => e.slug === row.slug && e.subjectSlug === row.subjectSlug
      );
      if (entry) {
        items.push({ itemId: row.id, spec: entry });
      } else {
        await recordItemOutcome(jobId, row.id, {
          status: "SKIPPED",
          error: "Page no longer in enrich plan",
        });
      }
    }

    if (plan) {
      const leftoverKeys = new Set<string>();
      for (const row of leftover) {
        leftoverKeys.add(`${row.subjectSlug}/${row.slug}`);
      }
      const doneRows = await prisma.contentGenItem.findMany({
        where: { jobId, status: { in: ["COMPLETED", "FAILED", "SKIPPED"] } },
        select: { subjectSlug: true, slug: true },
      });
      for (const row of doneRows) {
        leftoverKeys.add(`${row.subjectSlug}/${row.slug}`);
      }
      for (const entry of plan.entries.slice(state?.cursor ?? 0)) {
        const key = `${entry.subjectSlug}/${entry.slug}`;
        if (leftoverKeys.has(key)) continue;
        if (items.some((i) => `${i.spec.subjectSlug}/${i.spec.slug}` === key)) {
          continue;
        }
        items.push({ spec: entry });
      }
    }

    const base = apiPublicBase();
    const result = await runJobLoop({
      jobId,
      label: `visual_enrich:${studyGoal}`,
      items,
      startPauseCount,
      describe: (entry) => ({
        title: entry.title,
        slug: entry.slug,
        subjectSlug: entry.subjectSlug,
        topicSlug: entry.topicSlug,
      }),
      process: async (entry) =>
        enrichOnePageVisuals({
          studyGoal,
          subjectSlug: entry.subjectSlug,
          topicSlug: entry.topicSlug,
          slug: entry.slug,
          title: entry.title,
          contentUrl: entry.contentUrl,
          dryRun,
          apiPublicBase: base,
        }),
    });

    if (result.status === "PAUSED") {
      logger.warn("contentgen.visual_enrich.parked", { jobId, goal: studyGoal });
      return;
    }

    if (result.error === STOPPED_BY_ADMIN || isJobAborted(jobId)) {
      await skipOpenContentGenItems(jobId, STOPPED_BY_ADMIN);
      await finishJob(jobId, { status: "FAILED", error: STOPPED_BY_ADMIN });
      return;
    }

    await finishJob(jobId, { status: result.status, error: result.error ?? null });
    logger.info("contentgen.visual_enrich.done", {
      jobId,
      goal: studyGoal,
      status: result.status,
    });
  } finally {
    releaseJob(jobId);
  }
}
