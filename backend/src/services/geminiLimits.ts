/**
 * In-process pacing for Gemini free-tier quotas.
 *
 * gemini-flash-lite-latest (typical free): ~15 RPM, ~250k–1M TPM, ~500–1000 RPD.
 * gemini-embedding-001 (typical free): ~100 RPM, ~30k TPM, ~1000 RPD.
 *
 * Override with GEMINI_CHAT_RPM / GEMINI_EMBED_RPM when the project is billed.
 */

export type RateClock = {
  now: () => number;
  sleep: (ms: number) => Promise<void>;
};

const defaultClock: RateClock = {
  now: () => Date.now(),
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
};

const chatStamps: number[] = [];
const embedStamps: number[] = [];

function envPositive(name: string, fallback: number, cap: number): number {
  const n = Number(process.env[name] ?? fallback);
  return Number.isFinite(n) && n > 0 ? Math.min(n, cap) : fallback;
}

export function geminiChatRpm(): number {
  return envPositive("GEMINI_CHAT_RPM", 15, 4_000);
}

export function geminiEmbedRpm(): number {
  return envPositive("GEMINI_EMBED_RPM", 100, 10_000);
}

/** Small batches keep embedding-001 near ~30k TPM. */
export const DEFAULT_GEMINI_EMBED_BATCH = 4;
/** ~30 batches/min × 4 texts stays under 30k TPM for ~250-token chunks. */
export const DEFAULT_GEMINI_EMBED_PAUSE_MS = 2_000;

export function geminiChatMaxAttempts(): number {
  return 4;
}

/** Gemini often says "Please retry in 21.5s" in the 429 body. */
export function parseGeminiRetryMs(body: string, attempt: number): number {
  const m = body.match(/retry in ([0-9.]+)\s*s/i);
  if (m) {
    return Math.min(90_000, Math.ceil((Number(m[1]) + 0.5) * 1000));
  }
  // Flash-Lite ~15 RPM: 4s, 8s, 16s…
  return Math.min(60_000, 4000 * Math.pow(2, attempt - 1));
}

/**
 * Sliding 60s window. Leaves one slot of headroom so concurrent chat +
 * grounding + embeddings on the same key are less likely to 429.
 * When `maxWaitMs` is set, returns false instead of blocking past that budget
 * (used by web grounding so Study AI does not hang on "Still working…").
 */
export async function acquireSlidingWindow(
  stamps: number[],
  rpm: number,
  clock: RateClock = defaultClock,
  maxWaitMs?: number
): Promise<boolean> {
  const windowMs = 60_000;
  const max = Math.max(1, Math.floor(rpm) - (rpm > 1 ? 1 : 0));
  const deadline =
    maxWaitMs === undefined ? undefined : clock.now() + Math.max(0, maxWaitMs);
  while (true) {
    const now = clock.now();
    while (stamps.length && now - stamps[0] >= windowMs) stamps.shift();
    if (stamps.length < max) {
      stamps.push(now);
      return true;
    }
    const wait = stamps[0] + windowMs - now + 25;
    if (deadline !== undefined && now + Math.max(0, wait) > deadline) {
      return false;
    }
    if (wait > 0) await clock.sleep(wait);
  }
}

export async function acquireGeminiChatSlot(
  maxWaitMs?: number
): Promise<boolean> {
  return acquireSlidingWindow(chatStamps, geminiChatRpm(), defaultClock, maxWaitMs);
}

export async function acquireGeminiEmbedSlot(): Promise<void> {
  await acquireSlidingWindow(embedStamps, geminiEmbedRpm());
}
