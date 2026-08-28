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
 * - 3.7 Flash: Deep / Think longer (Premium)
 */
export const SHELF_GEMINI = {
  /** Quick chat + map sections — hot-swaps to newest Flash-Lite. */
  FAST: "gemini-flash-lite-latest",
  /** Pinned lite if the alias misbehaves on your key/region. */
  FAST_ALT: "gemini-3.5-flash-lite",
  /** Standard depth — hot-swaps to newest Flash. */
  STANDARD: "gemini-flash-latest",
  /** Premium deep mode — pinned (cost + quality). */
  DEEP: "gemini-3.7-flash",
  /** Extra flash fallback after latest alias. */
  FLASH: "gemini-3.6-flash",
  /** Pinned — reindex after any embedding model change. */
  EMBEDDING: "gemini-embedding-002",
  EMBEDDING_LEGACY: "gemini-embedding-001",
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
