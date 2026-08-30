import { describe, expect, it } from "vitest";
import { pdfContentFingerprint } from "./pdfByteCache";

describe("pdfContentFingerprint", () => {
  it("uses pdfKey and file size for library pages", () => {
    expect(
      pdfContentFingerprint("users/1/page/source.pdf:1048576:1710000000000")
    ).toBe("users/1/page/source.pdf:1048576");
    expect(pdfContentFingerprint("users/1/page/source.pdf:1048576")).toBe(
      "users/1/page/source.pdf:1048576"
    );
  });

  it("uses pdfKey alone for curriculum articles", () => {
    expect(pdfContentFingerprint("admin/subject/article.pdf")).toBe(
      "admin/subject/article.pdf"
    );
  });
});
