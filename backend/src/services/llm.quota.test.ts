import { describe, expect, it } from "vitest";
import {
  isFreeTierQuotaMessage,
  isHardBillingQuotaMessage,
} from "./llm.js";

describe("llm quota message classifiers", () => {
  const freeTierBody =
    "You exceeded your current quota, please check your plan and billing details. Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20";

  it("treats Gemini free_tier metric as free-tier (not hard billing)", () => {
    expect(isFreeTierQuotaMessage(freeTierBody)).toBe(true);
    expect(isHardBillingQuotaMessage(freeTierBody)).toBe(false);
  });

  it("detects hard billing quota without free_tier", () => {
    const msg =
      "You exceeded your current quota, please check your plan and billing details.";
    expect(isFreeTierQuotaMessage(msg)).toBe(false);
    expect(isHardBillingQuotaMessage(msg)).toBe(true);
  });

  it("treats plain RPM 429 text as neither", () => {
    const msg = "Resource exhausted. Please retry in 21.5s.";
    expect(isFreeTierQuotaMessage(msg)).toBe(false);
    expect(isHardBillingQuotaMessage(msg)).toBe(false);
  });
});
