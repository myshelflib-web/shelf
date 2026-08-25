import { describe, expect, it } from "vitest";
import {
  contentTypeForKind,
  maxBytesForKind,
  signDirectUpload,
  verifyDirectUpload,
} from "./directUpload.js";
import { PDF_MAX_BYTES } from "./contentFiles.js";

describe("directUpload", () => {
  it("signs a token the same user can complete", () => {
    process.env.JWT_SECRET = "test-secret-for-direct-upload";
    const token = signDirectUpload({
      userId: "u1",
      key: "users/u1/_file/notes/source.pdf",
      title: "Notes",
      slug: "notes",
      kind: "pdf",
      size: 1024,
      contentType: "application/pdf",
      userSubjectId: null,
      userTopicGroupId: null,
    });
    const claims = verifyDirectUpload(token);
    expect(claims.typ).toBe("direct-upload");
    expect(claims.userId).toBe("u1");
    expect(claims.kind).toBe("pdf");
    expect(claims.key).toContain("source.pdf");
  });

  it("maps kinds to PUT content types and size caps", () => {
    expect(contentTypeForKind("pdf")).toBe("application/pdf");
    expect(contentTypeForKind("docx")).toContain("wordprocessingml");
    expect(maxBytesForKind("pdf")).toBe(PDF_MAX_BYTES);
  });
});
