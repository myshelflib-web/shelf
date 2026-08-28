import { describe, expect, it } from "vitest";
import {
  SHELF_GEMINI,
  SHELF_GEMINI_CHAT_FALLBACKS,
} from "./shelfGeminiModels.js";

describe("shelfGeminiModels", () => {
  it("uses latest aliases for quick and standard tiers", () => {
    expect(SHELF_GEMINI.FAST).toBe("gemini-flash-lite-latest");
    expect(SHELF_GEMINI.STANDARD).toBe("gemini-flash-latest");
  });

  it("keeps lite models first in fallbacks", () => {
    expect(SHELF_GEMINI_CHAT_FALLBACKS[0]).toBe(SHELF_GEMINI.FAST);
    expect(SHELF_GEMINI_CHAT_FALLBACKS[1]).toBe(SHELF_GEMINI.FAST_ALT);
  });

  it("uses flash-latest for deep and defaults embeddings to 001", () => {
    expect(SHELF_GEMINI.DEEP).toBe("gemini-flash-latest");
    expect(SHELF_GEMINI.DEEP_PINNED).toBe("gemini-3.7-flash");
    expect(SHELF_GEMINI.EMBEDDING).toBe("gemini-embedding-001");
  });
});
