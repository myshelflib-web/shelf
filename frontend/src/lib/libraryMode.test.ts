import { describe, expect, it } from "vitest";
import { inferLibraryModeFromHref, resolveLibraryMode } from "./libraryMode";

describe("resolveLibraryMode", () => {
  it("keeps guests on preloaded even when the filter is All tracks", () => {
    expect(resolveLibraryMode("GENERAL", "personal", true)).toBe("preloaded");
    expect(resolveLibraryMode("GATE", "personal", true)).toBe("preloaded");
  });

  it("defaults signed-in General users to personal when unset", () => {
    expect(resolveLibraryMode("GENERAL", null, false)).toBe("personal");
  });

  it("honors an explicit Preloaded choice for signed-in General users", () => {
    expect(resolveLibraryMode("GENERAL", "preloaded", false)).toBe("preloaded");
    expect(resolveLibraryMode("GENERAL", "personal", false)).toBe("personal");
  });

  it("defaults signed-in exam goals to preloaded when unset", () => {
    expect(resolveLibraryMode("GATE", null, false)).toBe("preloaded");
    expect(resolveLibraryMode("UPSC", null, false)).toBe("preloaded");
  });

  it("honors an explicit Personal choice for signed-in exam goals", () => {
    expect(resolveLibraryMode("GATE", "personal", false)).toBe("personal");
    expect(resolveLibraryMode("GATE", "preloaded", false)).toBe("preloaded");
  });
});

describe("inferLibraryModeFromHref", () => {
  it("maps open learn articles to preloaded", () => {
    expect(
      inferLibraryModeFromHref("/learn/upsc-polity/constitution/preamble")
    ).toBe("preloaded");
    expect(
      inferLibraryModeFromHref("/learn/current-affairs/2026-03-01-headline")
    ).toBe("preloaded");
  });

  it("does not force mode for learn browse routes", () => {
    expect(inferLibraryModeFromHref("/learn/upsc-polity")).toBeNull();
    expect(inferLibraryModeFromHref("/learn?area=books")).toBeNull();
  });

  it("maps open personal pages to personal", () => {
    expect(inferLibraryModeFromHref("/my-content/file/notes")).toBe("personal");
    expect(
      inferLibraryModeFromHref("/my-content/gate/syllabus/file/overview")
    ).toBe("personal");
  });

  it("leaves library home alone", () => {
    expect(inferLibraryModeFromHref("/my-content")).toBeNull();
  });
});
