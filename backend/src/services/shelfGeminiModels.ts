/**
 * Shelf → Gemini model routing (Google AI Studio paid tier, 2026).
 *
 * Quick / Standard use Google `-latest` aliases so retired version strings
 * (e.g. gemini-2.5-*) do not 404 without a deploy. Deep + embeddings stay pinned
 * for predictable quality and vector dimensions.
 *
 * Quota-aware fallbacks (when a pinned id 404s):
 * - Lite: 15 RPM, 500 RPD — Quick chat, map-reduce sections
 * - Flash: 5 RPM, 20 RPD — Standard depth
 * - Deep / Think longer: same Flash alias as Standard (higher token + context caps).
 *   Override with LLM_MODEL_DEEP when a newer pinned id is stable on your key.
 */
export const SHELF_GEMINI = {
  /** Quick chat + map sections — hot-swaps to newest Flash-Lite. */
  FAST: "gemini-flash-lite-latest",
  /** Pinned lite if the alias misbehaves on your key/region. */
  FAST_ALT: "gemini-3.5-flash-lite",
  /** Standard depth — hot-swaps to newest Flash. */
  STANDARD: "gemini-flash-latest",
  /** Think longer — Flash alias; depth differs via tokens/context, not model id. */
  DEEP: "gemini-flash-latest",
  /** Opt-in pinned deep model when your key supports it: LLM_MODEL_DEEP=gemini-3.7-flash */
  DEEP_PINNED: "gemini-3.7-flash",
  /** Extra flash fallback after latest alias. */
  FLASH: "gemini-3.6-flash",
  /** Default embedding — widely available on AI Studio keys (768-dim). */
  EMBEDDING: "gemini-embedding-001",
  /** Opt-in when your key supports it: EMBEDDING_MODEL=gemini-embedding-002 */
  EMBEDDING_NEXT: "gemini-embedding-002",
} as const;

/** Lite-first; step up to Flash on 404 / rate limit. */
export const SHELF_GEMINI_CHAT_FALLBACKS: string[] = [
  SHELF_GEMINI.FAST,
  SHELF_GEMINI.FAST_ALT,
  "gemini-3.1-flash-lite",
  SHELF_GEMINI.STANDARD,
  "gemini-3.5-flash",
  SHELF_GEMINI.FLASH,
];
