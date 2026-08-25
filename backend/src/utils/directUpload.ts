import jwt from "jsonwebtoken";
import {
  DOCUMENT_MAX_BYTES,
  PDF_MAX_BYTES,
  type DetectedFileKind,
} from "./contentFiles.js";

export const DIRECT_UPLOAD_TYP = "direct-upload";

export type DirectUploadClaims = {
  typ: typeof DIRECT_UPLOAD_TYP;
  userId: string;
  key: string;
  title: string;
  slug: string;
  kind: DetectedFileKind;
  size: number;
  contentType: string;
  userSubjectId: string | null;
  userTopicGroupId: string | null;
};

export function contentTypeForKind(kind: DetectedFileKind): string {
  switch (kind) {
    case "pdf":
      return "application/pdf";
    case "text":
      return "text/plain";
    case "markdown":
      return "text/markdown";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
}

export function maxBytesForKind(kind: DetectedFileKind): number {
  return kind === "pdf" ? PDF_MAX_BYTES : DOCUMENT_MAX_BYTES;
}

export function signDirectUpload(
  claims: Omit<DirectUploadClaims, "typ">
): string {
  return jwt.sign(
    { ...claims, typ: DIRECT_UPLOAD_TYP },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" }
  );
}

export function verifyDirectUpload(token: string): DirectUploadClaims {
  const payload = jwt.verify(
    token,
    process.env.JWT_SECRET!
  ) as DirectUploadClaims;
  if (payload?.typ !== DIRECT_UPLOAD_TYP || !payload.key || !payload.userId) {
    throw new Error("Invalid upload token");
  }
  return payload;
}
