import { describe, expect, it } from "vitest";
import { listSubjectsIncludeTree } from "./librarySummarySubjects.js";

describe("listSubjectsIncludeTree", () => {
  it("defaults to summary stubs", () => {
    expect(listSubjectsIncludeTree({})).toBe(false);
    expect(listSubjectsIncludeTree({ tree: "0" })).toBe(false);
  });

  it("includes tree when requested or searching", () => {
    expect(listSubjectsIncludeTree({ tree: "1" })).toBe(true);
    expect(listSubjectsIncludeTree({ q: "polity" })).toBe(true);
    expect(listSubjectsIncludeTree({ tree: "0", q: "  " })).toBe(false);
  });
});
