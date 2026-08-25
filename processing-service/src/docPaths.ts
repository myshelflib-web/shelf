/**
 * S3 layout (single bucket):
 *
 *   admin/{subjectSlug}/{topicSlug}/{articleSlug}/source.pdf
 *   admin/{subjectSlug}/{topicSlug}/{articleSlug}/content.html
 *
 *   users/{userId}/{subjectSlug}/{topicSlug}/source.pdf
 *   users/{userId}/{subjectSlug}/{topicSlug}/content.html
 */

export const ADMIN_ROOT = "admin";
export const USERS_ROOT = "users";

export function adminDocPrefix(
  subjectSlug: string,
  topicSlug: string,
  articleSlug: string
): string {
  return `${ADMIN_ROOT}/${subjectSlug}/${topicSlug}/${articleSlug}`;
}

export function userDocPrefix(
  userId: string,
  subjectSlug: string,
  topicSlug: string
): string {
  return `${USERS_ROOT}/${userId}/${subjectSlug}/${topicSlug}`;
}

export function sourcePdfKey(docPrefix: string): string {
  return `${docPrefix}/source.pdf`;
}

export function contentHtmlKey(docPrefix: string): string {
  return `${docPrefix}/content.html`;
}

export function contentKeyFromPdfKey(pdfKey: string): string {
  return pdfKey.replace(/\/source\.pdf$/, "/content.html");
}

export function getS3Bucket(): string {
  return (
    process.env.S3_BUCKET ??
    process.env.S3_CONTENT_BUCKET ??
    process.env.S3_PDF_BUCKET ??
    "upsc-docs"
  );
}
