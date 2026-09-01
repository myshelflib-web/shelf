import { logger } from "../../utils/logger.js";
import { contentGenConcurrency } from "./contentGenConcurrency.js";
import {
  createRunningItem,
  markItemRunning,
  pauseJob,
  markJobRunning,
  recordItemOutcome,
  type ItemOutcome,
} from "./contentGenJobs.js";
import { isJobAborted, jobAbortSignal } from "./jobRegistry.js";
import {
  errorMessage,
  isFatalProviderError,
  isProviderOutage,
  isStopError,
  waitForProviderRecovery,
} from "./providerHealth.js";
import { STOPPED_BY_ADMIN } from "./stopJob.js";

export type ItemDescribe = {
  title: string;
  slug: string;
  subjectSlug: string;
  topicSlug: string;
};

export type LoopItem<T> = { spec: T; itemId?: string };

export type LoopResult = {
  status: "COMPLETED" | "FAILED" | "PAUSED";
  error?: string;
};

/** How many separate outages one run will ride out before staying parked. */
const MAX_PAUSES_PER_RUN = 5;

async function ensureItemId<T>(
  jobId: string,
  row: LoopItem<T>,
  describe: (spec: T) => ItemDescribe
): Promise<string> {
  if (row.itemId) {
    await markItemRunning(row.itemId);
    return row.itemId;
  }
  return createRunningItem(jobId, describe(row.spec));
}

type SlotResult =
  | { kind: "done"; index: number }
  | { kind: "fatal"; index: number; message: string }
  | { kind: "outage"; index: number; message: string }
  | { kind: "stopped"; index: number };

/**
 * Walks pending items in small parallel batches (default 2) so a paid Sarvam
 * key is not stuck on one page at a time. Still one job per process — two
 * jobs plus pdf.js OOMs a 512MB box.
 *
 * A provider outage does not consume the item: in-flight siblings finish,
 * the job is parked as PAUSED, and the failed slot is retried after the
 * watcher recovers.
 */
export async function runJobLoop<T>(opts: {
  jobId: string;
  label: string;
  items: LoopItem<T>[];
  startPauseCount?: number;
  describe: (spec: T) => ItemDescribe;
  process: (spec: T) => Promise<ItemOutcome>;
}): Promise<LoopResult> {
  const { jobId, label, items } = opts;
  const concurrency = contentGenConcurrency();
  let pauses = opts.startPauseCount ?? 0;
  let index = 0;

  async function runSlot(i: number): Promise<SlotResult> {
    const row = items[i];
    let itemId: string | null = null;
    try {
      itemId = await ensureItemId(jobId, row, opts.describe);
      const outcome = await opts.process(row.spec);
      await recordItemOutcome(jobId, itemId, outcome);
      items[i] = undefined as unknown as LoopItem<T>;
      return { kind: "done", index: i };
    } catch (err) {
      const message = errorMessage(err);
      if (isStopError(err) || isJobAborted(jobId)) {
        if (itemId) {
          await recordItemOutcome(jobId, itemId, {
            status: "SKIPPED",
            error: STOPPED_BY_ADMIN,
          });
        }
        return { kind: "stopped", index: i };
      }
      if (isFatalProviderError(err)) {
        if (itemId) {
          await recordItemOutcome(jobId, itemId, {
            status: "FAILED",
            error: message,
          });
        }
        return { kind: "fatal", index: i, message };
      }
      if (isProviderOutage(err)) {
        return { kind: "outage", index: i, message };
      }
      logger.warn("contentGen.loop.item_failed", { jobId, label, err: message });
      if (itemId) {
        await recordItemOutcome(jobId, itemId, {
          status: "FAILED",
          error: message,
        });
      }
      items[i] = undefined as unknown as LoopItem<T>;
      return { kind: "done", index: i };
    }
  }

  while (index < items.length) {
    if (isJobAborted(jobId)) {
      return { status: "FAILED", error: STOPPED_BY_ADMIN };
    }

    const batch: number[] = [];
    for (let k = 0; k < concurrency && index + k < items.length; k++) {
      const i = index + k;
      if (items[i]) batch.push(i);
    }
    if (batch.length === 0) {
      index += 1;
      continue;
    }

    const results = await Promise.all(batch.map((i) => runSlot(i)));
    const stopped = results.find((r) => r.kind === "stopped");
    if (stopped) {
      return { status: "FAILED", error: STOPPED_BY_ADMIN };
    }

    const fatal = results.find((r) => r.kind === "fatal");
    if (fatal && fatal.kind === "fatal") {
      logger.error("contentGen.loop.fatal", { jobId, label, err: fatal.message });
      return { status: "FAILED", error: fatal.message };
    }

    const outage = results.find((r) => r.kind === "outage");
    if (outage && outage.kind === "outage") {
      if (pauses >= MAX_PAUSES_PER_RUN) {
        await pauseJob(jobId, `Provider unstable: ${outage.message}`);
        return { status: "PAUSED", error: outage.message };
      }
      pauses += 1;
      logger.warn("contentGen.loop.paused", { jobId, label, err: outage.message });
      await pauseJob(jobId, outage.message);

      const outcome = await waitForProviderRecovery({
        label,
        signal: jobAbortSignal(jobId),
        onAttempt: (attempt, delayMs) => {
          logger.info("contentGen.loop.waiting", {
            jobId,
            label,
            attempt,
            delayMs,
          });
        },
      });

      if (outcome === "recovered") {
        await markJobRunning(jobId);
        index = outage.index;
        continue;
      }
      if (outcome === "aborted") {
        return { status: "FAILED", error: STOPPED_BY_ADMIN };
      }
      if (outcome === "fatal") return { status: "FAILED", error: outage.message };
      return { status: "PAUSED", error: outage.message };
    }

    index = Math.max(...batch) + 1;
  }

  return { status: "COMPLETED" };
}
