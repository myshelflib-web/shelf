import { describe, expect, it } from "vitest";
import { sarvamAuthHeaders, sarvamCompletionPayload } from "./sarvamRequest.js";

const messages = [{ role: "user" as const, content: "hi" }];

describe("sarvamCompletionPayload", () => {
  it("omits reasoning_effort and sets enable_thinking false when off", () => {
    const body = sarvamCompletionPayload({
      model: "sarvam-105b",
      messages,
      temperature: 0.3,
      maxTokens: 8192,
      reasoningEffort: null,
    });
    const json = JSON.stringify(body);
    expect(json).not.toContain("reasoning_effort");
    expect(body.chat_template_kwargs).toEqual({ enable_thinking: false });
    expect(body.extra_body).toEqual({
      chat_template_kwargs: { enable_thinking: false },
    });
  });

  it("sends reasoning_effort only when thinking is on", () => {
    const body = sarvamCompletionPayload({
      model: "sarvam-105b",
      messages,
      temperature: 0.35,
      maxTokens: 12288,
      reasoningEffort: "medium",
    });
    expect(body.reasoning_effort).toBe("medium");
    expect(body.chat_template_kwargs).toEqual({ enable_thinking: true });
  });
});

describe("sarvamAuthHeaders", () => {
  it("sends Bearer and subscription key", () => {
    const headers = sarvamAuthHeaders("sk_test");
    expect(headers.Authorization).toBe("Bearer sk_test");
    expect(headers["api-subscription-key"]).toBe("sk_test");
  });
});
