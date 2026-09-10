import { dispatchSyncStatus } from "@/lib/syncStatus";

let inflight = 0;
let endTimer: ReturnType<typeof setTimeout> | null = null;

function clearEndTimer() {
  if (endTimer) {
    clearTimeout(endTimer);
    endTimer = null;
  }
}

/** Start a tracked background save (refcount — nested calls collapse to one chip). */
export function beginApiSync(label = "Saving…"): void {
  clearEndTimer();
  inflight += 1;
  if (inflight === 1) {
    dispatchSyncStatus({ state: "saving", label });
  }
}

export function endApiSync(ok: boolean): void {
  inflight = Math.max(0, inflight - 1);
  if (inflight > 0) return;
  clearEndTimer();
  // Brief delay so rapid sequential saves (highlight then note) stay on Saving…
  endTimer = setTimeout(() => {
    endTimer = null;
    if (inflight > 0) return;
    if (ok) {
      dispatchSyncStatus({ state: "synced", label: "Synced" });
    } else {
      dispatchSyncStatus({ state: "error", label: "Not synced" });
    }
  }, 120);
}

function progressBodyTracksSync(body: BodyInit | null | undefined): boolean {
  if (typeof body !== "string") return false;
  try {
    const parsed = JSON.parse(body) as { completed?: unknown };
    return parsed.completed !== undefined;
  } catch {
    return false;
  }
}

/**
 * Whether a JSON API call should drive the header sync chip.
 * Skips reads, noisy reading-progress, auth/billing, and upload flows
 * (uploads already report via reportUploadSyncStatus).
 */
export function shouldTrackApiSync(
  path: string,
  method: string,
  body?: BodyInit | null
): boolean {
  const m = (method || "GET").toUpperCase();
  if (m === "GET" || m === "HEAD" || m === "OPTIONS") return false;

  if (path.includes("/uploads/")) return false;
  if (path.includes("/pdf-url")) return false;
  if (path.startsWith("/api/auth")) return false;
  if (path.startsWith("/api/subscription")) return false;
  if (path.startsWith("/api/admin")) return false;
  if (path.startsWith("/api/study")) return false;
  if (path.startsWith("/api/blog")) return false;
  if (path.startsWith("/api/internal")) return false;

  // Curriculum progress: stars always; mark-done only (not scroll %).
  if (path.startsWith("/api/progress/")) {
    if (/\/star(?:\?|$)/.test(path)) return true;
    return progressBodyTracksSync(body ?? null);
  }

  // Library reading progress — continuous view sync is noisy; mark-done only.
  if (/\/pages\/[^/]+\/progress(?:\?|$)/.test(path)) {
    return progressBodyTracksSync(body ?? null);
  }

  if (path.startsWith("/api/my-content")) return true;
  if (path.startsWith("/api/tasks")) return true;
  if (path.startsWith("/api/highlights")) return true;
  if (path.startsWith("/api/telegram") && m === "POST") return true;

  return false;
}

export async function withApiSyncStatus<T>(
  path: string,
  method: string,
  body: BodyInit | null | undefined,
  run: () => Promise<T>
): Promise<T> {
  if (!shouldTrackApiSync(path, method, body)) {
    return run();
  }
  beginApiSync("Saving…");
  try {
    const value = await run();
    endApiSync(true);
    return value;
  } catch (err) {
    endApiSync(false);
    throw err;
  }
}
