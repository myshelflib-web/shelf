import { describe, expect, it, afterEach } from "vitest";
import {
  embeddingApiKeySlots,
  isPaidKeyExhausted,
  llmApiKeySlots,
} from "./apiKeyPool.js";

describe("apiKeyPool", () => {
  const keys = [
    "LLM_API_KEY",
    "OPENAI_API_KEY",
    "LLM_API_KEY_FREE",
    "LLM_API_KEY_FALLBACK",
    "EMBEDDING_API_KEY",
    "EMBEDDING_API_KEY_FREE",
  ] as const;
  const saved: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
      delete saved[k];
    }
  });

  function setEnv(k: (typeof keys)[number], v: string | undefined) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }

  it("orders primary before fallback keys", () => {
    setEnv("LLM_API_KEY", "paid-key");
    setEnv("LLM_API_KEY_FREE", "free-key");
    const slots = llmApiKeySlots();
    expect(slots).toHaveLength(2);
    expect(slots[0]).toEqual({ key: "paid-key", tier: "primary" });
    expect(slots[1]).toEqual({ key: "free-key", tier: "fallback" });
  });

  it("uses only the free key for free-route chat", () => {
    setEnv("LLM_API_KEY", "paid-key");
    setEnv("LLM_API_KEY_FREE", "free-key");
    const slots = llmApiKeySlots("free");
    expect(slots).toHaveLength(1);
    expect(slots[0]?.key).toBe("free-key");
    expect(slots[0]?.tier).toBe("fallback");
  });

  it("uses paid key first on paid route", () => {
    setEnv("LLM_API_KEY", "paid-key");
    setEnv("LLM_API_KEY_FREE", "free-key");
    const slots = llmApiKeySlots("paid");
    expect(slots[0]?.key).toBe("paid-key");
    expect(slots[1]?.key).toBe("free-key");
  });

  it("detects prepay / billing exhaustion messages", () => {
    expect(isPaidKeyExhausted(402, "")).toBe(true);
    expect(
      isPaidKeyExhausted(403, "Your prepay credit balance is depleted")
    ).toBe(true);
    expect(
      isPaidKeyExhausted(429, "exceeded your current quota, check billing")
    ).toBe(true);
    expect(isPaidKeyExhausted(503, "model overloaded")).toBe(false);
  });

  it("uses dedicated embedding keys when set", () => {
    setEnv("EMBEDDING_API_KEY", "embed-paid");
    setEnv("EMBEDDING_API_KEY_FREE", "embed-free");
    setEnv("LLM_API_KEY", "chat-paid");
    const slots = embeddingApiKeySlots();
    expect(slots[0]?.key).toBe("embed-paid");
    expect(slots[1]?.key).toBe("embed-free");
  });
});
