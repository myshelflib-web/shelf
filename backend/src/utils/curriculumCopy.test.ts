import { describe, expect, it } from "vitest";
import { curriculumSourceUrl } from "../utils/curriculumCopy.js";

describe("curriculumSourceUrl", () => {
  it("marks a curriculum copy with a stable source URL", () => {
    expect(curriculumSourceUrl("abc")).toBe("shelf:curriculum:abc");
  });
});
