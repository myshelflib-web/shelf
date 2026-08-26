import { describe, expect, it } from "vitest";
import { mapStudyAiErrorMessage, toUserStudyAiError } from "./studyAiErrors";

describe("mapStudyAiErrorMessage", () => {
  it("hides thought_signature dumps", () => {
    expect(
      mapStudyAiErrorMessage(
        'Study AI request failed (400). [{ "error": { "code": 400, "message": "Function call is missing a thought_signature in functionCall parts.'
      )
    ).toBe("Study AI hit a temporary glitch. Please try again.");
  });

  it("maps AbortError", () => {
    expect(toUserStudyAiError(Object.assign(new Error("Aborted"), { name: "AbortError" }))).toBe(
      "Stopped."
    );
  });
});
