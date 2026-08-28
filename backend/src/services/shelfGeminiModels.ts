/**
 * Shelf → Gemini model routing (Google AI Studio paid tier, 2026).
 *
 * Quota-aware picks:
 * - Lite (3.5 / 3.1): 15 RPM, 500 RPD — default chat, map-reduce sections
 * - Flash (3.5 / 3.6): 5 RPM, 20 RPD — Standard depth (user opt-in)
 * - 3.7 Flash: 5 RPM, 20 RPD — Deep / Think longer only (Premium)
 * - Embedding 2: 100 RPM, 1K RPD — library vectors (reindex after switching from v1)
 */
export const SHELF_GEMINI = {
  FAST: "gemini-3.5-flash-lite",
  FAST_ALT: "gemini-3.1-flash-lite",
  STANDARD: "gemini-3.5-flash",
  DEEP: "gemini-3.7-flash",
  FLASH: "gemini-3.6-flash",
  EMBEDDING: "gemini-embedding-002",
  EMBEDDING_LEGACY: "gemini-embedding-001",
} as const;

/** Lite-first; only step up to Flash on 404 / unavailable. */
export const SHELF_GEMINI_CHAT_FALLBACKS: string[] = [
  SHELF_GEMINI.FAST,
  SHELF_GEMINI.FAST_ALT,
  SHELF_GEMINI.STANDARD,
  SHELF_GEMINI.FLASH,
];
