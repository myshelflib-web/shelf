import { describe, expect, it } from "vitest";
import {
  SKIP_THOUGHT_SIGNATURE,
  ensureThoughtSignatures,
  extraContentFromUnknown,
  finalizeStreamToolCalls,
  mergeToolCallDelta,
  readToolCalls,
} from "./llmToolCalls.js";

describe("llmToolCalls", () => {
  it("reads Gemini extra_content thought_signature", () => {
    const calls = readToolCalls([
      {
        id: "call_1",
        type: "function",
        extra_content: { google: { thought_signature: "sig-abc" } },
        function: { name: "web_search", arguments: '{"query":"x"}' },
      },
    ]);
    expect(calls?.[0].extra_content?.google?.thought_signature).toBe("sig-abc");
  });

  it("fills skip_thought_signature_validator when Gemini sent no signature", () => {
    const calls = ensureThoughtSignatures([
      {
        id: "call_1",
        type: "function",
        function: { name: "web_search", arguments: "{}" },
      },
    ]);
    expect(calls[0].extra_content?.google?.thought_signature).toBe(
      SKIP_THOUGHT_SIGNATURE
    );
  });

  it("merges streaming extra_content onto the matching tool call", () => {
    const acc = new Map();
    mergeToolCallDelta(acc, [
      { index: 0, id: "c1", function: { name: "web_search", arguments: "{" } },
    ]);
    mergeToolCallDelta(acc, [
      {
        index: 0,
        function: { arguments: "}" },
        extra_content: { google: { thought_signature: "stream-sig" } },
      },
    ]);
    const calls = finalizeStreamToolCalls(acc);
    expect(calls[0].function.arguments).toBe("{}");
    expect(calls[0].extra_content?.google?.thought_signature).toBe("stream-sig");
  });

  it("ignores empty extra_content", () => {
    expect(extraContentFromUnknown({ google: {} })).toBeUndefined();
    expect(extraContentFromUnknown(null)).toBeUndefined();
  });
});
