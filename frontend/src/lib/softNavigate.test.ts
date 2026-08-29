import { describe, expect, it } from "vitest";
import { isReaderHref } from "./softNavigate";

describe("isReaderHref", () => {
  it("treats share links as reader URLs", () => {
    expect(isReaderHref("/my-content/shared/abc?t=tok")).toBe(true);
    expect(isReaderHref("/my-content/file/notes")).toBe(true);
    expect(isReaderHref("/my-content")).toBe(false);
  });
});
