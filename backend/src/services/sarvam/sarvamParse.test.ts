import { describe, expect, it } from "vitest";
import { extractCompletionText } from "./sarvamParse.js";

describe("extractCompletionText", () => {
  it("reads a normal string content field", () => {
    expect(
      extractCompletionText({
        choices: [{ finish_reason: "stop", message: { content: "  hello  " } }],
      })
    ).toEqual({ text: "hello", finishReason: "stop", reasoningChars: 0 });
  });

  it("joins array content parts", () => {
    expect(
      extractCompletionText({
        choices: [
          {
            message: {
              content: [
                { type: "text", text: "foo" },
                { type: "text", text: "bar" },
              ],
            },
          },
        ],
      }).text
    ).toBe("foobar");
  });

  it("does not treat reasoning as the article when content is empty", () => {
    const extracted = extractCompletionText({
      choices: [
        {
          finish_reason: "length",
          message: { content: null, reasoning_content: "thinking…" },
        },
      ],
    });
    expect(extracted.text).toBe("");
    expect(extracted.finishReason).toBe("length");
    expect(extracted.reasoningChars).toBeGreaterThan(0);
  });
});
