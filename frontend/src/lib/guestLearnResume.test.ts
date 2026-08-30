import { describe, expect, it } from "vitest";
import { guestLearnResumeFromHref } from "./guestLearnResume";

describe("guestLearnResumeFromHref", () => {
  it("reads a curriculum article path", () => {
    expect(
      guestLearnResumeFromHref("/learn/gate/syllabus/ar-2026-syllabus")
    ).toEqual({
      subjectSlug: "gate",
      topicSlug: "syllabus",
      articleSlug: "ar-2026-syllabus",
    });
  });

  it("ignores browse paths without an article", () => {
    expect(guestLearnResumeFromHref("/learn")).toBeNull();
    expect(guestLearnResumeFromHref("/learn/gate")).toBeNull();
    expect(guestLearnResumeFromHref("/my-content")).toBeNull();
  });
});
