import { describe, expect, it } from "vitest";
import { bytesForPages, costPaiseForPages, perPageCostPaise } from "../costStorage.js";
import { catalogPacks, specsForGoal } from "./index.js";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("syllabus catalog", () => {
  it("has hundreds of grounded pages across every study goal", () => {
    const packs = catalogPacks();
    const total = packs.reduce((n, p) => n + p.articleCount, 0);
    expect(total).toBeGreaterThan(400);
    expect(packs.map((p) => p.studyGoal)).toEqual(
      expect.arrayContaining([
        "UPSC",
        "STATE_PCS",
        "JUDICIARY",
        "CA",
        "NEET_PG",
        "GATE",
        "GENERAL",
      ])
    );
  });

  it("reuses the compiled spec list instead of reallocating", () => {
    expect(specsForGoal("UPSC")).toBe(specsForGoal("UPSC"));
    expect(catalogPacks()).toBe(catalogPacks());
  });

  it("omits topic title lists from the overview payload", () => {
    for (const pack of catalogPacks()) {
      for (const subject of pack.subjects) {
        expect(subject).not.toHaveProperty("topics");
        expect(subject.articleCount).toBeGreaterThan(0);
      }
    }
  });

  it("keeps slugs unique within a goal and well-formed", () => {
    for (const pack of catalogPacks()) {
      const specs = specsForGoal(pack.studyGoal);
      const keys = specs.map((s) => `${s.subjectSlug}/${s.slug}`);
      expect(new Set(keys).size, pack.studyGoal).toBe(keys.length);
      for (const spec of specs) {
        expect(spec.slug).toMatch(SLUG);
        expect(spec.subjectSlug).toMatch(SLUG);
        expect(spec.mustCover.length, spec.slug).toBeGreaterThanOrEqual(4);
        expect(spec.syllabusAnchor.length, spec.slug).toBeGreaterThan(20);
      }
    }
  });

  it("can filter UPSC to a single subject", () => {
    const polity = specsForGoal("UPSC", { subjectSlug: "upsc-polity" });
    expect(polity.length).toBeGreaterThan(20);
    expect(polity.every((s) => s.subjectSlug === "upsc-polity")).toBe(true);
  });

  it("gives UPSC economy a topic-level catalog, not a handful of pages", () => {
    const economy = specsForGoal("UPSC", { subjectSlug: "upsc-economy" });
    expect(economy.length).toBeGreaterThan(25);
  });
});

describe("cost and storage estimates", () => {
  it("scales linearly with page count", () => {
    expect(costPaiseForPages(0)).toBe(0);
    expect(costPaiseForPages(10)).toBeGreaterThan(costPaiseForPages(1));
    expect(bytesForPages(10)).toBe(640_000);
    expect(perPageCostPaise()).toBeGreaterThan(100);
  });
});
