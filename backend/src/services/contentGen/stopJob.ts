import {
  finishJob,
  getContentGenJob,
  skipOpenContentGenItems,
} from "./contentGenJobs.js";
import { abortJob, isJobInFlight } from "./jobRegistry.js";

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

  const claimed = isJobInFlight(jobId);
  abortJob(jobId);

  // Loop is not in this process (deploy mid-run) — close the row ourselves.
  if (!claimed) {
    await skipOpenContentGenItems(jobId, STOPPED_BY_ADMIN);
    await finishJob(jobId, { status: "FAILED", error: STOPPED_BY_ADMIN });
  }
}
