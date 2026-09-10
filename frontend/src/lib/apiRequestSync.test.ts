import { describe, expect, it } from "vitest";
import { shouldTrackApiSync } from "./apiRequestSync";

describe("shouldTrackApiSync", () => {
  it("tracks library mutations and highlights", () => {
    expect(
      shouldTrackApiSync("/api/my-content/pages/1/title", "PATCH", "{}")
    ).toBe(true);
    expect(
      shouldTrackApiSync("/api/my-content/pages/1/highlights", "POST", "{}")
    ).toBe(true);
    expect(shouldTrackApiSync("/api/tasks", "POST", "{}")).toBe(true);
    expect(shouldTrackApiSync("/api/highlights", "POST", "{}")).toBe(true);
  });

  it("skips reads, uploads, and noisy progress", () => {
    expect(shouldTrackApiSync("/api/my-content/pages/1", "GET")).toBe(false);
    expect(
      shouldTrackApiSync("/api/my-content/uploads/init", "POST", "{}")
    ).toBe(false);
    expect(
      shouldTrackApiSync(
        "/api/my-content/pages/1/progress",
        "PATCH",
        JSON.stringify({ view: { pdfPage: 2 } })
      )
    ).toBe(false);
  });

  it("tracks mark-done and stars, not scroll progress", () => {
    expect(
      shouldTrackApiSync(
        "/api/my-content/pages/1/progress",
        "PATCH",
        JSON.stringify({ completed: true })
      )
    ).toBe(true);
    expect(
      shouldTrackApiSync("/api/progress/abc/star", "POST")
    ).toBe(true);
    expect(
      shouldTrackApiSync(
        "/api/progress/abc",
        "POST",
        JSON.stringify({ readPercent: 40 })
      )
    ).toBe(false);
  });
});
