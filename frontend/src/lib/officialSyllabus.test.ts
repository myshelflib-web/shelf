import { describe, expect, it } from "vitest";
import {
  isOfficialSyllabusSubject,
  isOfficialSyllabusSubjectSlug,
} from "./officialSyllabus";

describe("officialSyllabus", () => {
  it("recognizes canonical and legacy official syllabus slugs", () => {
    expect(isOfficialSyllabusSubjectSlug("official-syllabus-upsc")).toBe(true);
    expect(isOfficialSyllabusSubjectSlug("upsc-official-syllabus")).toBe(true);
    expect(isOfficialSyllabusSubjectSlug("syllabus-exam-pattern")).toBe(true);
    expect(isOfficialSyllabusSubjectSlug("upsc-polity")).toBe(false);
    expect(isOfficialSyllabusSubject({ slug: "official-syllabus-gate" })).toBe(
      true
    );
  });
});
