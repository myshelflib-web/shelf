import {
  completeJobIfIdle,
  finishJob,
  getContentGenJob,
  skipOpenContentGenItems,
} from "./contentGenJobs.js";
import { abortJob } from "./jobRegistry.js";

export const STOPPED_BY_ADMIN = "Stopped by admin";

export async function stopContentGenJob(jobId: string): Promise<void> {
  const job = await getContentGenJob(jobId);
  if (!job) throw new Error("Job not found");
  if (
    job.status !== "QUEUED" &&
    job.status !== "RUNNING" &&
    job.status !== "PAUSED"
  ) {
    throw new Error("This job is not running");
  }

  abortJob(jobId);

  // Every page already has a terminal row — just close the run. Do not mark
  // it Stopped; that hides a finished pack behind a fake failure.
  if (await completeJobIfIdle(jobId)) return;

  await skipOpenContentGenItems(jobId, STOPPED_BY_ADMIN);
  await finishJob(jobId, { status: "FAILED", error: STOPPED_BY_ADMIN });
}
