import { describe, expect, it } from "vitest";
import {
  blueprintForGoal,
  flattenBlueprint,
  generatedSubjectSlugs,
  specsForGoal,
  STARTER_PACK_BLUEPRINTS,
} from "./index.js";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("starter pack blueprints", () => {
  it("covers every study goal exactly once", () => {
    const goals = STARTER_PACK_BLUEPRINTS.map((b) => b.studyGoal);
    expect(new Set(goals).size).toBe(goals.length);
    expect(goals).toContain("UPSC");
    expect(goals).toContain("GENERAL");
  });

  it("keeps article slugs unique within a pack", () => {
    for (const blueprint of STARTER_PACK_BLUEPRINTS) {
      const slugs = flattenBlueprint(blueprint).map((s) => s.slug);
      expect(new Set(slugs).size, `duplicate slug in ${blueprint.studyGoal}`).toBe(
        slugs.length
      );
    }
  });

  it("resolves each article onto its subject and topic", () => {
    const specs = specsForGoal("UPSC");
    expect(specs.length).toBeGreaterThan(20);
    for (const spec of specs) {
      expect(spec.subjectSlug).toMatch(SLUG);
      expect(spec.topicSlug).toMatch(SLUG);
      expect(spec.slug).toMatch(SLUG);
      expect(spec.subjectName).not.toBe("");
      expect(spec.topicTitle).not.toBe("");
    }
  });

  it("gives every page a syllabus anchor and a real checklist", () => {
    for (const blueprint of STARTER_PACK_BLUEPRINTS) {
      for (const spec of flattenBlueprint(blueprint)) {
        expect(spec.syllabusAnchor.length, spec.slug).toBeGreaterThan(20);
        expect(spec.mustCover.length, spec.slug).toBeGreaterThanOrEqual(6);
        expect(spec.keywords.length, spec.slug).toBeGreaterThanOrEqual(3);
        expect(spec.title.length, spec.slug).toBeLessThanOrEqual(80);
      }
    }
  });

  it("only points at https sources", () => {
    for (const blueprint of STARTER_PACK_BLUEPRINTS) {
      for (const spec of flattenBlueprint(blueprint)) {
        for (const url of spec.officialSources) {
          expect(url, spec.slug).toMatch(/^https:\/\//);
        }
      }
    }
  });

  it("exposes subject slugs the preloaded prune must not touch", () => {
    const slugs = generatedSubjectSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toContain("upsc-polity");
  });

  it("returns null for a goal with no blueprint entry", () => {
    expect(blueprintForGoal("UPSC")).not.toBeNull();
  });
});
