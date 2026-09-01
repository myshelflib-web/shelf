import prisma from "../utils/prisma.js";
import {
  INDEX_CONTENT_VERSION,
  INDEX_LEASE_PREFIX,
  indexUserPage,
} from "./libraryIndex.js";
import { isFreshIndexLease } from "./libraryIndexText.js";
import { isVectorConfigured } from "./vectorStore.js";
import { logger, errorFields } from "../utils/logger.js";
import { isTransientError, withRetry } from "../utils/retry.js";
import { withDbRetry } from "../utils/dbRetry.js";
import { recordVectorIndexPage } from "../utils/appMetrics.js";
import { TimeoutError, withTimeout } from "../utils/timeout.js";
import { isAnyContentGenInFlight } from "./contentGen/jobRegistry.js";

const DEFAULT_INTERVAL_MS = 120_000;
/** Keep at 1 on small Render instances — embed + pdf.js of two pages OOMs 512MB. */
const DEFAULT_BATCH_SIZE = 1;
const MAX_BATCH_SIZE = 1;
const DEFAULT_PAGE_TIMEOUT_MS = 180_000;
const DEFAULT_BATCH_TIMEOUT_MS = 300_000;
const DEFAULT_STUCK_MS = 360_000;
const DEFAULT_PAGE_ATTEMPTS = 3;
const DEFAULT_START_DELAY_MS = 120_000;
const DEFAULT_LEASE_MS = 15 * 60 * 1000;

let timer: ReturnType<typeof setInterval> | null = null;
let startTimer: ReturnType<typeof setTimeout> | null = null;
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

function batchLimit(requested?: number): number {
  const configured = requested ?? envNum("VECTOR_INDEX_BATCH_SIZE", DEFAULT_BATCH_SIZE);
  if (configured > MAX_BATCH_SIZE) {
    logger.warn("vector_worker.batch_capped", {
      configured,
      cap: MAX_BATCH_SIZE,
    });
  }
  return Math.min(configured, MAX_BATCH_SIZE);
}

function leaseTtlMs(): number {
  return envNum("VECTOR_INDEX_LEASE_MS", DEFAULT_LEASE_MS);
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

function isFreshLeaseRow(hash: string, updatedAt: Date): boolean {
  return (
    hash.startsWith(INDEX_LEASE_PREFIX) &&
    isFreshIndexLease(updatedAt, Date.now(), leaseTtlMs())
  );
}

export async function findPagesNeedingIndex(batchSize: number): Promise<string[]> {
  return withDbRetry(async () => {
  const neverIndexed = await prisma.userTopic.findMany({
    where: { status: "PUBLISHED", vectorIndex: null },
    select: { id: true },
    orderBy: { updatedAt: "asc" },
    take: batchSize,
  });
  if (neverIndexed.length >= batchSize) {
    return neverIndexed.map((p) => p.id);
  }

  let remaining = batchSize - neverIndexed.length;
  const taken = new Set(neverIndexed.map((p) => p.id));
  const leaseCutoff = new Date(Date.now() - leaseTtlMs());

  const expiredLeases = await prisma.pageVectorIndex.findMany({
    where: {
      page: { status: "PUBLISHED" },
      contentHash: { startsWith: INDEX_LEASE_PREFIX },
      updatedAt: { lt: leaseCutoff },
      pageId: { notIn: [...taken] },
    },
    select: { pageId: true },
    orderBy: { updatedAt: "asc" },
    take: remaining,
  });
  for (const row of expiredLeases) taken.add(row.pageId);
  remaining = batchSize - taken.size;
  if (remaining <= 0) {
    return [...neverIndexed.map((p) => p.id), ...expiredLeases.map((r) => r.pageId)];
  }

  // Refresh rows indexed before INDEX_CONTENT_VERSION (e.g. metadata-only v4).
  const outdated = await prisma.pageVectorIndex.findMany({
    where: {
      page: { status: "PUBLISHED" },
      NOT: { contentHash: { startsWith: `${INDEX_CONTENT_VERSION}:` } },
      pageId: { notIn: [...taken] },
    },
    select: { pageId: true },
    orderBy: { updatedAt: "asc" },
    take: remaining,
  });
  for (const row of outdated) taken.add(row.pageId);
  remaining = batchSize - taken.size;

  const maybeStale =
    remaining > 0
      ? await prisma.userTopic.findMany({
          where: {
            status: "PUBLISHED",
            vectorIndex: { isNot: null },
            id: { notIn: [...taken] },
          },
          select: {
            id: true,
            updatedAt: true,
            vectorIndex: { select: { updatedAt: true, contentHash: true } },
          },
          orderBy: { updatedAt: "asc" },
          take: remaining * 10,
        })
      : [];

  const stale = maybeStale
    .filter((p) => {
      if (!p.vectorIndex) return false;
      if (isFreshLeaseRow(p.vectorIndex.contentHash, p.vectorIndex.updatedAt)) {
        return false;
      }
      return p.updatedAt > p.vectorIndex.updatedAt;
    })
    .slice(0, remaining)
    .map((p) => p.id);

  return [
    ...neverIndexed.map((p) => p.id),
    ...expiredLeases.map((r) => r.pageId),
    ...outdated.map((r) => r.pageId),
    ...stale,
  ];
  }, { label: "vector_index.find_pages" });
}

async function indexPageWithReliability(pageId: string): Promise<void> {
  const pageTimeoutMs = envNum("VECTOR_INDEX_PAGE_TIMEOUT_MS", DEFAULT_PAGE_TIMEOUT_MS);
  const attempts = envNum("VECTOR_INDEX_PAGE_ATTEMPTS", DEFAULT_PAGE_ATTEMPTS);
  const started = Date.now();

  try {
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
  recordVectorIndexPage({
    ok: true,
    durationMs: Date.now() - started,
  });
  } catch (err) {
    recordVectorIndexPage({
      ok: false,
      durationMs: Date.now() - started,
    });
    throw err;
  }
}

export async function runVectorIndexBatch(batchSize?: number): Promise<number> {
  if (!isVectorConfigured()) return 0;

  if (isAnyContentGenInFlight()) {
    logger.info("vector_worker.deferred", { reason: "content_gen" });
    return 0;
  }

  if (Date.now() < pauseUntil) {
    logger.info("vector_worker.paused_rate_limit", {
      resumeInSec: Math.ceil((pauseUntil - Date.now()) / 1000),
    });
    return 0;
  }

  const limit = batchLimit(batchSize);
  const batchTimeoutMs = envNum("VECTOR_INDEX_BATCH_TIMEOUT_MS", DEFAULT_BATCH_TIMEOUT_MS);

  const pageIds = await withTimeout(
    findPagesNeedingIndex(limit),
    30_000,
    "findPagesNeedingIndex"
  );

  if (pageIds.length === 0) {
    consecutiveFailures = 0;
    const [published, indexed] = await withDbRetry(
      () =>
        Promise.all([
          prisma.userTopic.count({ where: { status: "PUBLISHED" } }),
          prisma.pageVectorIndex.count(),
        ]),
      { label: "vector_index.idle_counts" }
    );
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
        await sleep(envNum("VECTOR_INDEX_PAGE_PAUSE_MS", 3000));
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
  if (timer || startTimer) return;

  const intervalMs = envNum("VECTOR_INDEX_WORKER_INTERVAL_MS", DEFAULT_INTERVAL_MS);
  const startDelayMs = envNum("VECTOR_INDEX_START_DELAY_MS", DEFAULT_START_DELAY_MS);

  logger.info("vector_worker.started", {
    intervalMs,
    startDelayMs,
    batchSize: batchLimit(),
    pageTimeoutMs: envNum("VECTOR_INDEX_PAGE_TIMEOUT_MS", DEFAULT_PAGE_TIMEOUT_MS),
    batchTimeoutMs: envNum("VECTOR_INDEX_BATCH_TIMEOUT_MS", DEFAULT_BATCH_TIMEOUT_MS),
    stuckMs: envNum("VECTOR_INDEX_STUCK_MS", DEFAULT_STUCK_MS),
  });

  startTimer = setTimeout(() => {
    startTimer = null;
    void tick();
    timer = setInterval(() => {
      void tick();
    }, intervalMs);
  }, startDelayMs);
}

export function stopVectorIndexWorker(): void {
  if (startTimer) {
    clearTimeout(startTimer);
    startTimer = null;
  }
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  running = false;
  runStartedAt = 0;
}
