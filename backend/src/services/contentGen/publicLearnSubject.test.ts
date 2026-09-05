import { describe, expect, it } from "vitest";
import { isPublicLearnSubject } from "./publicLearnSubject.js";

describe("isPublicLearnSubject", () => {
  it("keeps generated starter-pack subjects and news briefs", () => {
    expect(isPublicLearnSubject("upsc-polity")).toBe(true);
    expect(isPublicLearnSubject("study-skills-learning")).toBe(true);
    expect(isPublicLearnSubject("exam-briefs-upsc")).toBe(true);
  });

  it("includes official exam syllabus subjects from S3", () => {
    expect(isPublicLearnSubject("official-syllabus-upsc")).toBe(true);
    expect(isPublicLearnSubject("gate-official-syllabus")).toBe(true);
    expect(isPublicLearnSubject("syllabus-exam-pattern")).toBe(true);
  });

  it("excludes leftover preloaded catalogs", () => {
    expect(isPublicLearnSubject("ncert")).toBe(false);
    expect(isPublicLearnSubject("open-textbooks")).toBe(false);
    expect(isPublicLearnSubject("official-portals")).toBe(false);
  });
});
