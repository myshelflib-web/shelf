import { logger } from "../../utils/logger.js";
import {
  createRunningItem,
  markItemRunning,
  pauseJob,
  markJobRunning,
  recordItemOutcome,
  type ItemOutcome,
} from "./contentGenJobs.js";
import {
  errorMessage,
  isFatalProviderError,
  isProviderOutage,
  waitForProviderRecovery,
} from "./providerHealth.js";

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

/**
 * Walks the pending items for a job. Specs without an `itemId` get a row only
 * when work starts, so a 600-page run does not insert 600 QUEUED rows up front.
 *
 * A provider outage does not consume the item: the job is parked as PAUSED, a
 * watcher backs off until the API answers again, and the same item is retried.
 * If the watcher gives up the job stays PAUSED with its remaining items QUEUED,
 * so a manual resume or the next backend start can pick it up where it stopped.
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
  let pauses = opts.startPauseCount ?? 0;
  let index = 0;

  while (index < items.length) {
    const row = items[index];
    let itemId: string | null = null;

    try {
      itemId = await ensureItemId(jobId, row, opts.describe);
      const outcome = await opts.process(row.spec);
      await recordItemOutcome(jobId, itemId, outcome);
      items[index] = undefined as unknown as LoopItem<T>;
      index += 1;
      continue;
    } catch (err) {
      const message = errorMessage(err);

      if (isFatalProviderError(err)) {
        if (itemId) {
          await recordItemOutcome(jobId, itemId, {
            status: "FAILED",
            error: message,
          });
        }
        logger.error("contentGen.loop.fatal", { jobId, label, err: message });
        return { status: "FAILED", error: message };
      }

      if (isProviderOutage(err)) {
        if (pauses >= MAX_PAUSES_PER_RUN) {
          await pauseJob(jobId, `Provider unstable: ${message}`);
          return { status: "PAUSED", error: message };
        }
        pauses += 1;

        logger.warn("contentGen.loop.paused", { jobId, label, err: message });
        await pauseJob(jobId, message);

        const outcome = await waitForProviderRecovery({
          label,
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
          continue;
        }
        if (outcome === "fatal") return { status: "FAILED", error: message };
        return { status: "PAUSED", error: message };
      }

      logger.warn("contentGen.loop.item_failed", { jobId, label, err: message });
      if (itemId) {
        await recordItemOutcome(jobId, itemId, {
          status: "FAILED",
          error: message,
        });
      }
      items[index] = undefined as unknown as LoopItem<T>;
      index += 1;
    }
  }

  return { status: "COMPLETED" };
}
