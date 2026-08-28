import { describe, expect, it } from "vitest";
import { ragToolsEnabled } from "./studyAgent.js";

describe("ragToolsEnabled", () => {
  it("disables tools for slash-command bubbles", () => {
    expect(ragToolsEnabled("/flashcards")).toBe(false);
    expect(ragToolsEnabled("/pyq")).toBe(false);
  });

  it("keeps tools for chip labels and plain asks", () => {
    expect(ragToolsEnabled("Remind me")).toBe(true);
    expect(ragToolsEnabled("What is Article 21?")).toBe(true);
  });
});
