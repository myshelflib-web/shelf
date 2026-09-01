/**
 * Jobs actively running in this process. A paused job is still claimed while
 * its watcher waits, so a manual resume cannot start a second run over the
 * same items.
 */
const inFlight = new Set<string>();

export function claimJob(jobId: string): boolean {
  if (inFlight.has(jobId)) return false;
  inFlight.add(jobId);
  return true;
}

export function releaseJob(jobId: string): void {
  inFlight.delete(jobId);
}

export function isJobInFlight(jobId: string): boolean {
  return inFlight.has(jobId);
}

/** True while this process is generating or waiting out a provider pause. */
export function isAnyContentGenInFlight(): boolean {
  return inFlight.size > 0;
}
