import { describe, expect, it } from "vitest";
import { enqueuePrompt, takeNextPrompt } from "./studyAiQueue";

describe("studyAiQueue", () => {
  it("enqueues then dequeues in order", () => {
    const a = enqueuePrompt([], "first");
    const b = enqueuePrompt(a, "second", "data:image/png;base64,x");
    expect(b).toHaveLength(2);
    const first = takeNextPrompt(b);
    expect(first.next?.text).toBe("first");
    const second = takeNextPrompt(first.rest);
    expect(second.next?.text).toBe("second");
    expect(second.next?.imageBase64).toBe("data:image/png;base64,x");
    expect(takeNextPrompt(second.rest).next).toBeNull();
  });
});
