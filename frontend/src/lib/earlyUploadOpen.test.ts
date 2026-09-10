import { describe, expect, it } from "vitest";
import { contentTypeFromUploadFile } from "./earlyUploadOpen";

describe("contentTypeFromUploadFile", () => {
  it("maps extensions", () => {
    expect(
      contentTypeFromUploadFile(new File([], "a.pdf", { type: "application/pdf" }))
    ).toBe("PDF");
    expect(contentTypeFromUploadFile(new File([], "a.txt"))).toBe("TEXT");
    expect(contentTypeFromUploadFile(new File([], "a.md"))).toBe("MARKDOWN");
    expect(contentTypeFromUploadFile(new File([], "a.docx"))).toBe("DOCX");
  });
});
