import { describe, expect, it } from "vitest";
import {
  displayStreamStatusDetail,
  formatStreamStatusDetail,
} from "./studyAiStreamLabels";

describe("studyAiStreamLabels", () => {
  it("maps live and done copy", () => {
    expect(formatStreamStatusDetail("Searching your library…", false)).toBe(
      "Exploring library"
    );
    expect(formatStreamStatusDetail("Searching your library…", true)).toBe(
      "Explored library"
    );
  });

  it("handles section progress", () => {
    expect(
      displayStreamStatusDetail("Reading section 2 of 5…", false)
    ).toBe("Reading section 2 of 5");
    expect(displayStreamStatusDetail("Reading section 2 of 5…", true)).toBe(
      "Read section 2 of 5"
    );
  });

  it("formats retrieval hits", () => {
    expect(displayStreamStatusDetail("Found 3 pages in Physics", true)).toBe(
      "Found 3 pages"
    );
  });
});
