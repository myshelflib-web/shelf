import { isPremiumUser } from "./paywall.js";

export const FREE_STORAGE_BYTES = 100 * 1024 * 1024;
/** Free accounts created before the 100 MB cap keep the previous 250 MB quota. */
export const LEGACY_FREE_STORAGE_BYTES = 250 * 1024 * 1024;
export const LEGACY_FREE_STORAGE_BEFORE = new Date("2026-08-28T00:00:00.000Z");
export const PREMIUM_STORAGE_BYTES = 1024 * 1024 * 1024;
/** Monthly Study AI pool — hard stop when exhausted (resets each calendar month). */
export const FREE_LLM_TOKENS = Number(process.env.FREE_LLM_TOKENS ?? 50_000);
export const PREMIUM_LLM_TOKENS = Number(
  process.env.PREMIUM_LLM_TOKENS ?? 1_000_000
);

/** Max messages retained per Study AI chat thread (user + assistant). */
export const FREE_CHAT_MESSAGES = Number(process.env.FREE_CHAT_MESSAGES ?? 30);
export const PREMIUM_CHAT_MESSAGES = Number(
  process.env.PREMIUM_CHAT_MESSAGES ?? 300
);

/** Indexed text chunks in the vector DB (Study AI retrieval). */
export const FREE_VECTOR_CHUNKS = Number(process.env.FREE_VECTOR_CHUNKS ?? 500);
export const PREMIUM_VECTOR_CHUNKS = Number(
  process.env.PREMIUM_VECTOR_CHUNKS ?? 10_000
);
export const MAX_CHUNKS_PER_PAGE = Number(process.env.MAX_CHUNKS_PER_PAGE ?? 40);

/** Saved Study AI syllabus / relevancy docs per user. */
export const FREE_RELEVANCY_DOCS = Number(process.env.FREE_RELEVANCY_DOCS ?? 10);
export const PREMIUM_RELEVANCY_DOCS = Number(
  process.env.PREMIUM_RELEVANCY_DOCS ?? 50
);

export type QuotaUser = {
  plan: string;
  role: string;
  subscriptionExpiresAt?: Date | string | null;
  storageUsedBytes?: bigint | number;
  llmTokensUsed?: number;
  llmTokensResetAt?: Date | string | null;
  vectorChunksUsed?: number;
  createdAt?: Date | string | null;
};

function isLegacyFreeStorage(user: QuotaUser): boolean {
  if (!user.createdAt) return true;
  const created =
    user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt);
  if (Number.isNaN(created.getTime())) return true;
  return created.getTime() < LEGACY_FREE_STORAGE_BEFORE.getTime();
}

export function storageLimitBytes(user: QuotaUser): number {
  if (user.role === "ADMIN" || isPremiumUser(user)) return PREMIUM_STORAGE_BYTES;
  if (isLegacyFreeStorage(user)) return LEGACY_FREE_STORAGE_BYTES;
  return FREE_STORAGE_BYTES;
}

export function llmTokenLimit(user: QuotaUser): number {
  if (user.role === "ADMIN" || isPremiumUser(user)) return PREMIUM_LLM_TOKENS;
  return FREE_LLM_TOKENS;
}

export function vectorChunkLimit(user: QuotaUser): number {
  if (user.role === "ADMIN" || isPremiumUser(user)) return PREMIUM_VECTOR_CHUNKS;
  return FREE_VECTOR_CHUNKS;
}

export function chatMessageLimit(user: QuotaUser): number {
  if (user.role === "ADMIN" || isPremiumUser(user)) return PREMIUM_CHAT_MESSAGES;
  return FREE_CHAT_MESSAGES;
}

export function relevancyDocLimit(user: QuotaUser): number {
  if (user.role === "ADMIN" || isPremiumUser(user)) return PREMIUM_RELEVANCY_DOCS;
  return FREE_RELEVANCY_DOCS;
}

export function assertRelevancyDocRoom(user: QuotaUser, usedCount: number): void {
  const limit = relevancyDocLimit(user);
  if (usedCount >= limit) {
    const premium = isPremiumUser(user) || user.role === "ADMIN";
    throw new QuotaError(
      premium
        ? `Relevancy doc limit reached (${limit}). Delete one to add another.`
        : `Free plan allows ${FREE_RELEVANCY_DOCS} relevancy docs. Upgrade for ${PREMIUM_RELEVANCY_DOCS}.`
    );
  }
}

/** How many prior turns to send to the LLM (half of retained messages, capped). */
export function chatHistoryWindow(user: QuotaUser): number {
  const limit = chatMessageLimit(user);
  return Math.min(limit, Math.max(8, Math.floor(limit / 2)));
}

export function usedVectorChunks(user: QuotaUser): number {
  return user.vectorChunksUsed ?? 0;
}

export function usedBytes(user: QuotaUser): number {
  return Number(user.storageUsedBytes ?? 0);
}

export class QuotaError extends Error {
  status = 402;
  constructor(message: string) {
    super(message);
    this.name = "QuotaError";
  }
}

export function assertStorageRoom(user: QuotaUser, extraBytes: number): void {
  const limit = storageLimitBytes(user);
  if (usedBytes(user) + extraBytes > limit) {
    throw new QuotaError(
      "Storage limit reached on your plan. Upgrade for more space."
    );
  }
}

/** Block only when the monthly pool is exhausted — never pre-reject by estimated cost. */
export function assertLlmRoom(user: QuotaUser, extraTokens = 1): void {
  const limit = llmTokenLimit(user);
  const used = user.llmTokensUsed ?? 0;
  if (used + extraTokens > limit) {
    throw new QuotaError(
      "Study AI token limit reached for this month. Upgrade for more, or wait until next month."
    );
  }
}

export function shouldResetLlmWindow(resetAt: Date | string | null | undefined): boolean {
  if (!resetAt) return true;
  const d = new Date(resetAt);
  const now = new Date();
  return (
    d.getUTCFullYear() !== now.getUTCFullYear() ||
    d.getUTCMonth() !== now.getUTCMonth()
  );
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}
