import { describe, expect, it } from "vitest";
import { visualSearchQuery } from "./openverse.js";

describe("visualSearchQuery", () => {
  it("adds medical context for NEET PG", () => {
    expect(visualSearchQuery("Cardiac cycle", "NEET_PG")).toContain("medical");
  });

  it("adds India context for UPSC", () => {
    expect(visualSearchQuery("Monsoon", "UPSC")).toContain("India");
  });
});
