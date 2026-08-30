import { describe, expect, it } from "vitest";
import {
  lockedFeatureLabel,
  resolveAnnotationLock,
} from "./preloadedReadOnly";

describe("resolveAnnotationLock", () => {
  it("locks preloaded docs for signed-in users", () => {
    expect(
      resolveAnnotationLock({
        signInGateActive: false,
        canAnnotate: undefined,
        isPreloaded: true,
      })
    ).toEqual({ locked: true, gate: "save-to-library" });
  });

  it("prefers sign-in gate over preloaded", () => {
    expect(
      resolveAnnotationLock({
        signInGateActive: true,
        isPreloaded: true,
        canAnnotate: undefined,
      })
    ).toEqual({ locked: true, gate: "sign-in" });
  });
});

describe("lockedFeatureLabel", () => {
  it("uses save-to-library copy when gated", () => {
    expect(
      lockedFeatureLabel("save-to-library", "highlight with pen")
    ).toBe("Save to library to highlight with pen");
  });
});
