import { errorFields, logger } from "../../utils/logger.js";
import {
  getContentGenJob,
  listPausedJobs,
  remainingWorkCount,
} from "./contentGenJobs.js";
import { isJobInFlight } from "./jobRegistry.js";
import { runNewsPackJob } from "./news/runNewsPack.js";
import { runStarterPackJob } from "./runStarterPack.js";

/** Continues a paused job from its remaining plan cursor (or leftover rows). */
export async function resumeContentGenJob(jobId: string): Promise<void> {
  if (isJobInFlight(jobId)) throw new Error("Job is already running");

  const job = await getContentGenJob(jobId);
  if (!job) throw new Error("Job not found");
  if (job.status === "COMPLETED") throw new Error("Job has already finished");

  const remaining = await remainingWorkCount(jobId);
  if (remaining === 0) throw new Error("Job has no remaining pages to generate");

  const run =
    job.kind === "NEWS_BRIEF"
      ? runNewsPackJob(jobId, job.studyGoal, job.dryRun, job.resumeAttempts)
      : runStarterPackJob(jobId, job.studyGoal, job.dryRun, job.resumeAttempts);

  void run.catch((err) => {
    logger.error("contentgen.resume.crashed", { jobId, ...errorFields(err) });
  });
}

/**
 * Picks up jobs left paused (or cut off mid-run by a restart) when the API
 * boots, so an outage that outlives the process still finishes on its own.
 */
export async function resumePendingContentGenJobs(): Promise<void> {
  let jobs: Awaited<ReturnType<typeof listPausedJobs>>;
  try {
    jobs = await listPausedJobs();
  } catch (err) {
    logger.warn("contentgen.resume.scan_failed", { ...errorFields(err) });
    return;
  }

  if (jobs.length === 0) return;
  logger.info("contentgen.resume.scan", { count: jobs.length });

  for (const job of jobs) {
    try {
      if (isJobInFlight(job.id)) continue;
      await resumeContentGenJob(job.id);
    } catch (err) {
      logger.warn("contentgen.resume.skipped", {
        jobId: job.id,
        ...errorFields(err),
      });
    }
  }
}
