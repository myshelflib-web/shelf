import { describe, expect, it } from "vitest";
import {
  parseOfficialSyllabusKey,
  parseOfficialSyllabusKeys,
} from "./parseKeys.js";

describe("parseOfficialSyllabusKey", () => {
  it("maps dedicated prefix keys to an exam subject", () => {
    const parsed = parseOfficialSyllabusKey(
      "admin/official-syllabus/upsc/cse-2026/source.pdf"
    );
    expect(parsed).toMatchObject({
      studyGoal: "UPSC",
      subjectSlug: "official-syllabus-upsc",
      subjectName: "UPSC CSE",
      topicSlug: "official",
      articleSlug: "cse-2026",
      title: "Cse 2026",
    });
  });

  it("keeps topic folders when present", () => {
    const parsed = parseOfficialSyllabusKey(
      "admin/official-syllabus/gate/computer-science/cs-2026/source.pdf"
    );
    expect(parsed).toMatchObject({
      studyGoal: "GATE",
      subjectSlug: "official-syllabus-gate",
      topicSlug: "computer-science",
      articleSlug: "cs-2026",
    });
  });

  it("accepts a loose PDF under syllabus/", () => {
    const parsed = parseOfficialSyllabusKey("syllabus/ca/icai-final.pdf");
    expect(parsed).toMatchObject({
      studyGoal: "CA",
      subjectSlug: "official-syllabus-ca",
      articleSlug: "icai-final",
    });
  });

  it("maps admin subject folders that look like official syllabi", () => {
    const parsed = parseOfficialSyllabusKey(
      "admin/upsc-official-syllabus/papers/prelims/source.pdf"
    );
    expect(parsed).toMatchObject({
      studyGoal: "UPSC",
      subjectSlug: "official-syllabus-upsc",
      topicSlug: "papers",
      articleSlug: "prelims",
    });
  });

  it("ignores personal library keys and non-PDFs", () => {
    expect(
      parseOfficialSyllabusKey("users/abc/official-syllabus/upsc/cse/source.pdf")
    ).toBeNull();
    expect(
      parseOfficialSyllabusKey("admin/official-syllabus/upsc/cse/content.html")
    ).toBeNull();
    expect(parseOfficialSyllabusKey("admin/upsc-polity/rights/overview/source.pdf")).toBeNull();
  });
});

describe("parseOfficialSyllabusKeys", () => {
  it("dedupes the same exam article", () => {
    const list = parseOfficialSyllabusKeys([
      "admin/official-syllabus/upsc/cse/source.pdf",
      "admin/official-syllabus/upsc/cse/source.pdf",
    ]);
    expect(list).toHaveLength(1);
  });
});
