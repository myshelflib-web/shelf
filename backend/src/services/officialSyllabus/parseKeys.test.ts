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
      title: "CSE 2026",
    });
    expect(
      parseOfficialSyllabusKey(
        "admin/official-syllabus/gate/cs/cs-2026/source.pdf"
      )
    ).toMatchObject({
      title: "Computer Science 2026",
      topicTitle: "Computer Science",
    });
  });

  it("names other official exam PDFs", () => {
    expect(
      parseOfficialSyllabusKey(
        "admin/official-syllabus/upsc/cds/cds-i-2026/source.pdf"
      )
    ).toMatchObject({
      studyGoal: "UPSC",
      topicTitle: "CDS",
      title: "CDS I 2026",
    });
    expect(
      parseOfficialSyllabusKey(
        "admin/official-syllabus/state-pcs/rpsc/rpsc-ras-pre-2024/source.pdf"
      )
    ).toMatchObject({
      studyGoal: "STATE_PCS",
      topicTitle: "RPSC RAS",
      title: "RPSC RAS Prelims 2024",
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
