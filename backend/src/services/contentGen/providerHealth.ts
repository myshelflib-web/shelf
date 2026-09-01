import { logger } from "../../utils/logger.js";
import { generationChat } from "./generationChat.js";

/** Errors that mean "the provider is down or refusing us", not "this prompt was bad". */
const OUTAGE_PATTERNS = [
  /\b(429|500|502|503|504)\b/,
  /rate.?limit/i,
  /quota/i,
  /overload/i,
  /capacity/i,
  /unavailable/i,
  /timed? ?out/i,
  /timeout/i,
  /socket hang up/i,
  /network|fetch failed|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN/i,
  /non-JSON response/i,
];

/** Errors where retrying will never help — the run must fail, not pause. */
const FATAL_PATTERNS = [
  /\b(401|403)\b/,
  /not configured/i,
  /api key/i,
  /invalid.*credential/i,
  /unauthorized|forbidden/i,
];

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function isFatalProviderError(err: unknown): boolean {
  const message = errorMessage(err);
  return FATAL_PATTERNS.some((p) => p.test(message));
}

/** True when the failure looks like provider downtime worth waiting out. */
export function isProviderOutage(err: unknown): boolean {
  if (isFatalProviderError(err)) return false;
  const message = errorMessage(err);
  return OUTAGE_PATTERNS.some((p) => p.test(message));
}

/** Cheapest possible call that proves the provider is answering again. */
export async function probeProvider(): Promise<boolean> {
  try {
    await generationChat(
      [
        { role: "system", content: "Reply with the single word OK." },
        { role: "user", content: "ping" },
      ],
      { maxTokens: 32, temperature: 0, metricsFlow: "content_gen_probe", reasoningEffort: null }
    );
    return true;
  } catch (err) {
    if (isFatalProviderError(err)) throw err;
    return false;
  }
}

const BASE_DELAY_MS = 30_000;
const MAX_DELAY_MS = 15 * 60_000;

/** Backoff schedule for the health watcher: 30s, 1m, 2m, 4m, 8m, then 15m. */
export function backoffDelayMs(attempt: number): number {
  return Math.min(BASE_DELAY_MS * 2 ** Math.max(0, attempt), MAX_DELAY_MS);
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve();
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true }
    );
  });
}

export type RecoveryOutcome = "recovered" | "fatal" | "gave-up" | "aborted";

/**
 * Polls the provider until it answers again. Returns "gave-up" after
 * maxAttempts so a permanently dead provider does not hold a watcher forever —
 * the job stays paused and can be resumed by hand or at next startup.
 */
export async function waitForProviderRecovery(opts: {
  label: string;
  startAttempt?: number;
  maxAttempts?: number;
  signal?: AbortSignal;
  onAttempt?: (attempt: number, delayMs: number) => void | Promise<void>;
}): Promise<RecoveryOutcome> {
  const maxAttempts = opts.maxAttempts ?? 12;
  let attempt = opts.startAttempt ?? 0;

  while (attempt < maxAttempts) {
    const delay = backoffDelayMs(attempt);
    await opts.onAttempt?.(attempt + 1, delay);
    await sleep(delay, opts.signal);
    if (opts.signal?.aborted) return "aborted";

    try {
      if (await probeProvider()) {
        logger.info("contentGen.provider.recovered", {
          label: opts.label,
          attempt: attempt + 1,
        });
        return "recovered";
      }
    } catch (err) {
      logger.warn("contentGen.provider.fatal", {
        label: opts.label,
        error: errorMessage(err),
      });
      return "fatal";
    }

    attempt += 1;
  }

  return "gave-up";
}
