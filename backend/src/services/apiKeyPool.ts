/**
 * Primary (paid) + optional fallback (free-tier) Gemini API keys.
 * Free Shelf users are routed to LLM_API_KEY_FREE only (see apiKeyRoute.ts).
 */

import { logger } from "../utils/logger.js";
import { SHELF_GEMINI } from "./shelfGeminiModels.js";
import type { ApiKeyRoute } from "./apiKeyRoute.js";

export type ApiKeySlot = {
  key: string;
  tier: "primary" | "fallback";
};

function sanitizeSecret(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/^["']|["']$/g, "").trim();
  return trimmed || undefined;
}

function keyHint(key: string | undefined): string | null {
  if (!key) return null;
  if (key.startsWith("AQ.")) return `AQ.…(len=${key.length})`;
  if (key.startsWith("AIza")) return `AIza…(len=${key.length})`;
  return `${key.slice(0, 4)}…(len=${key.length})`;
}

function uniqueSlots(keys: Array<string | undefined>): ApiKeySlot[] {
  const out: ApiKeySlot[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ key, tier: i === 0 ? "primary" : "fallback" });
  }
  return out;
}

/** Paid key (+ optional free fallback on billing exhaust). Free route = free key only. */
export function llmApiKeySlots(route: ApiKeyRoute = "paid"): ApiKeySlot[] {
  const paid = sanitizeSecret(
    process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY
  );
  const free = sanitizeSecret(
    process.env.LLM_API_KEY_FREE ?? process.env.LLM_API_KEY_FALLBACK
  );
  if (route === "free") {
    if (!free) {
      logger.warn("api_key.free_route_missing_free_key", {
        hint: "Set LLM_API_KEY_FREE for unbilled free-tier users",
      });
    }
    const key = free ?? paid;
    return key ? [{ key, tier: "fallback" }] : [];
  }
  return uniqueSlots([paid, free]);
}

export function embeddingApiKeySlots(route: ApiKeyRoute = "paid"): ApiKeySlot[] {
  const embedPaid = sanitizeSecret(process.env.EMBEDDING_API_KEY);
  const embedFree = sanitizeSecret(
    process.env.EMBEDDING_API_KEY_FREE ?? process.env.EMBEDDING_API_KEY_FALLBACK
  );
  const chatPaid = sanitizeSecret(
    process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY
  );
  const chatFree = sanitizeSecret(
    process.env.LLM_API_KEY_FREE ?? process.env.LLM_API_KEY_FALLBACK
  );

  if (route === "free") {
    const key = embedFree ?? chatFree ?? embedPaid ?? chatPaid;
    if (!embedFree && !chatFree) {
      logger.warn("api_key.free_route_missing_embed_key", {
        hint: "Set EMBEDDING_API_KEY_FREE or LLM_API_KEY_FREE",
      });
    }
    return key ? [{ key, tier: "fallback" }] : [];
  }

  if (embedPaid) return uniqueSlots([embedPaid, embedFree]);
  return llmApiKeySlots("paid");
}

/** Models that fit typical free-tier RPM/RPD when the fallback key is active. */
export const FREE_TIER_CHAT_MODELS: string[] = [
  SHELF_GEMINI.FAST,
  SHELF_GEMINI.FAST_ALT,
  "gemini-3.1-flash-lite",
];

export class ApiBillingHandoffError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiBillingHandoffError";
    this.status = status;
  }
}

/** True when the primary paid key should hand off to LLM_API_KEY_FREE. */
export function isPaidKeyExhausted(status: number, message: string): boolean {
  if (status === 402) return true;
  const m = message.toLowerCase();
  if (
    /no credits|credit balance|prepay balance|purchase credits|add funds|depleted your|payment required|insufficient.*balance|billing account.*(disabled|suspended|closed)/i.test(
      m
    )
  ) {
    return true;
  }
  if (status === 403 && /billing|credit|payment|prepay/i.test(m)) return true;
  if (
    status === 429 &&
    /billing|payment|credit balance|prepay|insufficient_quota/i.test(m)
  ) {
    return true;
  }
  return false;
}

export function apiKeyPoolSummary(): Record<string, unknown> {
  const llm = llmApiKeySlots();
  const embed = embeddingApiKeySlots();
  return {
    llmPrimaryHint: keyHint(llm[0]?.key),
    llmFallbackHint: keyHint(llm[1]?.key),
    hasLlmFallback: llm.length > 1,
    embedPrimaryHint: keyHint(embed[0]?.key),
    embedFallbackHint: keyHint(embed[1]?.key),
    hasEmbedFallback: embed.length > 1,
  };
}
