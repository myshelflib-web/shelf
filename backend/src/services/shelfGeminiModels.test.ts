import { describe, expect, it } from "vitest";
import {
  SHELF_GEMINI,
  SHELF_GEMINI_CHAT_FALLBACKS,
} from "./shelfGeminiModels.js";

describe("shelfGeminiModels", () => {
  it("keeps lite models first in fallbacks", () => {
    expect(SHELF_GEMINI_CHAT_FALLBACKS[0]).toBe(SHELF_GEMINI.FAST);
    expect(SHELF_GEMINI_CHAT_FALLBACKS[1]).toBe(SHELF_GEMINI.FAST_ALT);
  });

  it("reserves deep model for premium tier", () => {
    expect(SHELF_GEMINI.DEEP).toBe("gemini-3.7-flash");
  });
});
