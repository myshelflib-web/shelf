import { describe, expect, it } from "vitest";
import {
  estimateCostUsd,
  normalizeModelId,
  ratesForModel,
  resolveTokenSplit,
} from "./llmPricing.js";

describe("llmPricing", () => {
  it("normalizes model ids", () => {
    expect(normalizeModelId("models/gemini-flash-latest")).toBe(
      "gemini-flash-latest"
    );
  });

  it("returns embedding rates for embedding models", () => {
    const rates = ratesForModel("gemini-embedding-001");
    expect(rates.outputPerM).toBe(0);
    expect(rates.inputPerM).toBeGreaterThan(0);
  });

  it("splits total tokens when prompt/completion missing", () => {
    const split = resolveTokenSplit({ totalTokens: 1000 });
    expect(split.total).toBe(1000);
    expect(split.prompt + split.completion).toBe(1000);
  });

  it("estimates non-zero USD for chat usage", () => {
    const cost = estimateCostUsd("gemini-flash-latest", {
      promptTokens: 1000,
      completionTokens: 500,
    });
    expect(cost).toBeGreaterThan(0);
  });
});
