import { describe, expect, it } from "vitest";
import {
  mapStudyAiErrorMessage,
  studyAiFailureStub,
} from "./studyAiUserError.js";

describe("mapStudyAiErrorMessage", () => {
  it("hides Gemini thought_signature / function-call dumps", () => {
    const raw =
      'Study AI request failed (400). [{ "error": { "code": 400, "message": "Function call is missing a thought_signature in functionCall parts. This';
    expect(mapStudyAiErrorMessage(raw)).toBe(
      "Study AI hit a temporary glitch. Please try again."
    );
  });

  it("keeps short Shelf-authored messages", () => {
    expect(
      mapStudyAiErrorMessage("Study AI rate limit hit. Wait a moment and try again.")
    ).toBe("Study AI rate limit hit. Wait a moment and try again.");
  });

  it("defaults unknown provider JSON", () => {
    expect(mapStudyAiErrorMessage('{"error":{"message":"boom"}}')).toBe(
      "Study AI couldn’t finish that reply. Please try again."
    );
  });
});

describe("studyAiFailureStub", () => {
  it("maps Error instances", () => {
    expect(studyAiFailureStub(new Error("thought_signature missing"))).toBe(
      "Study AI hit a temporary glitch. Please try again."
    );
  });
});
