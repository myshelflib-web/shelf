import { errorFields, logger } from "../../utils/logger.js";
import {
  createContentGenJob,
  getContentGenJob,
  hasRunningJob,
  listFailedContentGenItems,
} from "./contentGenJobs.js";
import { uniqueStarterEntries } from "./jobPlan.js";
import { generationModelLabel } from "./generationChat.js";
import { parseStoredCluster } from "./news/newsTypes.js";
import { runNewsPackJob } from "./news/runNewsPack.js";
import { runStarterPackJob } from "./runStarterPack.js";

/**
 * Resume cannot redo FAILED pages — the cursor already moved past them.
 * This starts a new job whose plan is only those failed rows.
 */
export async function retryFailedContentGenJob(
  jobId: string,
  requestedById?: string | null
): Promise<{ jobId: string; plannedCount: number }> {
  if (await hasRunningJob()) {
    throw new Error("A generation job is already running");
  }

  const job = await getContentGenJob(jobId);
  if (!job) throw new Error("Job not found");
  if (job.status === "QUEUED" || job.status === "RUNNING") {
    throw new Error("This job is still running — wait for it to finish");
  }
  if (job.status === "PAUSED") {
    throw new Error("This job is paused — resume it instead of retrying failed pages");
  }

  const failed = await listFailedContentGenItems(jobId);
  if (failed.length === 0) {
    throw new Error(
      "No failed page rows left to retry. They may have been pruned — generate the pack again with Skip published."
    );
  }

  if (job.kind === "NEWS_BRIEF") {
    return retryFailedNews(job, failed, requestedById);
  }

  const entries = uniqueStarterEntries(failed);
  const newJobId = await createContentGenJob({
    kind: "STARTER_PACK",
    studyGoal: job.studyGoal,
    model: generationModelLabel(),
    dryRun: job.dryRun,
    plannedCount: entries.length,
    requestedById: requestedById ?? null,
    plan: { v: 1, kind: "STARTER_PACK", entries },
  });

  void runStarterPackJob(newJobId, job.studyGoal, job.dryRun).catch((err) => {
    logger.error("contentgen.retry.crashed", { jobId: newJobId, ...errorFields(err) });
  });

  return { jobId: newJobId, plannedCount: entries.length };
}

async function retryFailedNews(
  job: NonNullable<Awaited<ReturnType<typeof getContentGenJob>>>,
  failed: Awaited<ReturnType<typeof listFailedContentGenItems>>,
  requestedById?: string | null
): Promise<{ jobId: string; plannedCount: number }> {
  const clusters = failed
    .map((row) => parseStoredCluster(row.payload))
    .filter((c): c is NonNullable<typeof c> => c !== null);

  if (clusters.length === 0) {
    throw new Error(
      "News briefs cannot be retried after the run finishes — story clusters are not kept. Start a new news run instead."
    );
  }

  const topicSlug = failed[0]?.topicSlug || "retry";
  const newJobId = await createContentGenJob({
    kind: "NEWS_BRIEF",
    studyGoal: job.studyGoal,
    model: generationModelLabel(),
    dryRun: job.dryRun,
    plannedCount: clusters.length,
    requestedById: requestedById ?? null,
    plan: {
      v: 1,
      kind: "NEWS_BRIEF",
      topicSlug,
      topicTitle: topicSlug,
      clusters,
    },
  });

  void runNewsPackJob(newJobId, job.studyGoal, job.dryRun).catch((err) => {
    logger.error("contentgen.retry.crashed", { jobId: newJobId, ...errorFields(err) });
  });

  return { jobId: newJobId, plannedCount: clusters.length };
}
