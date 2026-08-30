import { describe, expect, it } from "vitest";
import { resolveLibraryMode } from "./libraryMode";

describe("resolveLibraryMode", () => {
  it("keeps guests on preloaded even when the filter is All tracks", () => {
    expect(resolveLibraryMode("GENERAL", "personal", true)).toBe("preloaded");
    expect(resolveLibraryMode("GATE", "personal", true)).toBe("preloaded");
  });

  it("forces signed-in General users onto personal", () => {
    expect(resolveLibraryMode("GENERAL", "preloaded", false)).toBe("personal");
  });

  it("honors preferred mode for signed-in exam goals", () => {
    expect(resolveLibraryMode("GATE", "personal", false)).toBe("personal");
    expect(resolveLibraryMode("GATE", "preloaded", false)).toBe("preloaded");
  });
});
