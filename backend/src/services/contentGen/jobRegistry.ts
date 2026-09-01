/**
 * Jobs actively running in this process. A paused job is still claimed while
 * its watcher waits, so a manual resume cannot start a second run over the
 * same items.
 */
const inFlight = new Set<string>();
const abortByJob = new Map<string, AbortController>();

export function claimJob(jobId: string): boolean {
  if (inFlight.has(jobId)) return false;
  inFlight.add(jobId);
  abortByJob.set(jobId, new AbortController());
  return true;
}

export function releaseJob(jobId: string): void {
  inFlight.delete(jobId);
  abortByJob.delete(jobId);
}

export function isJobInFlight(jobId: string): boolean {
  return inFlight.has(jobId);
}

/** True while this process is generating or waiting out a provider pause. */
export function isAnyContentGenInFlight(): boolean {
  return inFlight.size > 0;
}

/** Abort in-flight Sarvam calls for this job. No-op if it is not claimed here. */
export function abortJob(jobId: string): boolean {
  const controller = abortByJob.get(jobId);
  if (!controller) return false;
  if (!controller.signal.aborted) controller.abort();
  return true;
}

export function jobAbortSignal(jobId: string): AbortSignal | undefined {
  return abortByJob.get(jobId)?.signal;
}

export function isJobAborted(jobId: string): boolean {
  return abortByJob.get(jobId)?.signal.aborted === true;
}
