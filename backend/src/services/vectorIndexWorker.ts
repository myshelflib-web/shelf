import prisma from "../utils/prisma.js";
import { indexUserPage } from "./libraryIndex.js";
import { isVectorConfigured } from "./vectorStore.js";
import { logger, errorFields } from "../utils/logger.js";
import { isTransientError, withRetry } from "../utils/retry.js";
import { TimeoutError, withTimeout } from "../utils/timeout.js";

const DEFAULT_INTERVAL_MS = 60_000;
/** Keep small on Gemini free tier (100 embed requests / window). */
const DEFAULT_BATCH_SIZE = 2;
const DEFAULT_PAGE_TIMEOUT_MS = 120_000;
const DEFAULT_BATCH_TIMEOUT_MS = 300_000;
const DEFAULT_STUCK_MS = 360_000;
const DEFAULT_PAGE_ATTEMPTS = 3;

let timer: ReturnType<typeof setInterval> | null = null;
let running = false;
let runStartedAt = 0;
let pauseUntil = 0;
let consecutiveFailures = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function envNum(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function isRateLimitError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /rate limited|quota exceeded|\b429\b/i.test(message);
}

function rateLimitWaitSec(err: unknown): number {
  const message = err instanceof Error ? err.message : String(err);
  const retryMatch = message.match(/retry in ([0-9.]+)\s*s/i);
  if (retryMatch) return Math.min(120, Math.ceil(Number(retryMatch[1]) + 2));
  return 60;
}

export async function findPagesNeedingIndex(batchSize: number): Promise<string[]> {
  const neverIndexed = await prisma.userTopic.findMany({
    where: { status: "PUBLISHED", vectorIndex: null },
    select: { id: true },
    orderBy: { updatedAt: "asc" },
    take: batchSize,
  });
  if (neverIndexed.length >= batchSize) {
    return neverIndexed.map((p) => p.id);
  }

  const remaining = batchSize - neverIndexed.length;
  const maybeStale = await prisma.userTopic.findMany({
    where: {
      status: "PUBLISHED",
      vectorIndex: { isNot: null },
      id: { notIn: neverIndexed.map((p) => p.id) },
    },
    select: {
      id: true,
      updatedAt: true,
      vectorIndex: { select: { updatedAt: true } },
    },
    orderBy: { updatedAt: "asc" },
    take: remaining * 10,
  });

  const stale = maybeStale
    .filter((p) => p.vectorIndex && p.updatedAt > p.vectorIndex.updatedAt)
    .slice(0, remaining)
    .map((p) => p.id);

  return [...neverIndexed.map((p) => p.id), ...stale];
}

async function indexPageWithReliability(pageId: string): Promise<void> {
  const pageTimeoutMs = envNum("VECTOR_INDEX_PAGE_TIMEOUT_MS", DEFAULT_PAGE_TIMEOUT_MS);
  const attempts = envNum("VECTOR_INDEX_PAGE_ATTEMPTS", DEFAULT_PAGE_ATTEMPTS);

  await withRetry(
    () =>
      withTimeout(
        indexUserPage(pageId),
        pageTimeoutMs,
        `indexUserPage(${pageId})`
      ),
    {
      attempts,
      delayMs: 1000,
      maxDelayMs: 15_000,
      label: `vector_index.page.${pageId}`,
      shouldRetry: (err) => {
        if (isRateLimitError(err)) return false;
        return isTransientError(err) || err instanceof TimeoutError;
      },
    }
  );
}

export async function runVectorIndexBatch(batchSize?: number): Promise<number> {
  if (!isVectorConfigured()) return 0;

  if (Date.now() < pauseUntil) {
    logger.info("vector_worker.paused_rate_limit", {
      resumeInSec: Math.ceil((pauseUntil - Date.now()) / 1000),
    });
    return 0;
  }

  const limit = batchSize ?? envNum("VECTOR_INDEX_BATCH_SIZE", DEFAULT_BATCH_SIZE);
  const batchTimeoutMs = envNum("VECTOR_INDEX_BATCH_TIMEOUT_MS", DEFAULT_BATCH_TIMEOUT_MS);

  const pageIds = await withTimeout(
    findPagesNeedingIndex(limit),
    30_000,
    "findPagesNeedingIndex"
  );

  if (pageIds.length === 0) {
    consecutiveFailures = 0;
    const [published, indexed] = await Promise.all([
      prisma.userTopic.count({ where: { status: "PUBLISHED" } }),
      prisma.pageVectorIndex.count(),
    ]);
    logger.info("vector_worker.idle", {
      publishedPages: published,
      indexedPages: indexed,
      pending: Math.max(0, published - indexed),
    });
    return 0;
  }

  logger.info("vector_worker.batch_start", { pageIds });

  const work = async () => {
    let indexed = 0;
    for (const pageId of pageIds) {
      try {
        await indexPageWithReliability(pageId);
        indexed += 1;
        consecutiveFailures = 0;
        await sleep(envNum("VECTOR_INDEX_PAGE_PAUSE_MS", 1500));
      } catch (err) {
        if (isRateLimitError(err)) {
          const waitSec = rateLimitWaitSec(err);
          pauseUntil = Date.now() + waitSec * 1000;
          logger.warn("vector_worker.backing_off", { waitSec, pageId });
          break;
        }
        consecutiveFailures += 1;
        logger.error("vector_worker.index_failed", {
          pageId,
          consecutiveFailures,
          ...errorFields(err),
        });
        // After repeated hard failures, cool down briefly so we don't spin.
        if (consecutiveFailures >= 5) {
          pauseUntil = Date.now() + 60_000;
          logger.warn("vector_worker.circuit_open", {
            consecutiveFailures,
            pauseSec: 60,
          });
          break;
        }
      }
    }
    return indexed;
  };

  const indexed = await withTimeout(work(), batchTimeoutMs, "vector_index.batch");
  logger.info("vector_worker.batch_done", { requested: pageIds.length, indexed });
  return indexed;
}

function recoverIfStuck(): boolean {
  if (!running || !runStartedAt) return false;
  const stuckMs = envNum("VECTOR_INDEX_STUCK_MS", DEFAULT_STUCK_MS);
  const elapsed = Date.now() - runStartedAt;
  if (elapsed < stuckMs) return false;
  logger.error("vector_worker.stuck_recovered", {
    elapsedMs: elapsed,
    stuckMs,
  });
  running = false;
  runStartedAt = 0;
  pauseUntil = Date.now() + 15_000;
  return true;
}

async function tick(): Promise<void> {
  recoverIfStuck();
  if (running) {
    logger.debug("vector_worker.skip_in_flight", {
      runningForMs: runStartedAt ? Date.now() - runStartedAt : 0,
    });
    return;
  }

  running = true;
  runStartedAt = Date.now();
  try {
    await runVectorIndexBatch();
  } catch (err) {
    consecutiveFailures += 1;
    logger.error("vector_worker.tick_failed", {
      consecutiveFailures,
      ...errorFields(err),
    });
    if (err instanceof TimeoutError || isTransientError(err)) {
      pauseUntil = Date.now() + 20_000;
    }
  } finally {
    running = false;
    runStartedAt = 0;
  }
}

export function startVectorIndexWorker(): void {
  if (!isVectorConfigured()) return;
  if (process.env.VECTOR_INDEX_WORKER === "false") return;
  if (timer) return;

  const intervalMs = envNum("VECTOR_INDEX_WORKER_INTERVAL_MS", DEFAULT_INTERVAL_MS);

  logger.info("vector_worker.started", {
    intervalMs,
    batchSize: envNum("VECTOR_INDEX_BATCH_SIZE", DEFAULT_BATCH_SIZE),
    pageTimeoutMs: envNum("VECTOR_INDEX_PAGE_TIMEOUT_MS", DEFAULT_PAGE_TIMEOUT_MS),
    batchTimeoutMs: envNum("VECTOR_INDEX_BATCH_TIMEOUT_MS", DEFAULT_BATCH_TIMEOUT_MS),
    stuckMs: envNum("VECTOR_INDEX_STUCK_MS", DEFAULT_STUCK_MS),
  });

  void tick();
  timer = setInterval(() => {
    void tick();
  }, intervalMs);
}

export function stopVectorIndexWorker(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  running = false;
  runStartedAt = 0;
}
