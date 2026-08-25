/**
 * S3 layout (single bucket):
 *
 *   admin/{subjectSlug}/{topicSlug}/{articleSlug}/source.pdf
 *   admin/{subjectSlug}/{topicSlug}/{articleSlug}/content.html
 *
 *   users/{userId}/{subjectSlug}/{topicSlug}/{pageSlug}/source.pdf
 *   users/{userId}/{subjectSlug}/_file/{pageSlug}/source.pdf   (notebook-level)
 *   users/{userId}/_file/{pageSlug}/source.pdf                 (library root)
 */

export const ADMIN_ROOT = "admin";
export const USERS_ROOT = "users";
/** Object-key segment for pages without a topic (not a URL slug). */
export const FILE_SEGMENT = "_file";

export type DocScope = "admin" | "user";

export function adminDocPrefix(
  subjectSlug: string,
  topicSlug: string,
  articleSlug: string
): string {
  return `${ADMIN_ROOT}/${subjectSlug}/${topicSlug}/${articleSlug}`;
}

export function userDocPrefix(
  userId: string,
  subjectSlug: string | null | undefined,
  topicGroupSlug: string | null | undefined,
  pageSlug: string
): string {
  if (!subjectSlug) {
    return `${USERS_ROOT}/${userId}/${FILE_SEGMENT}/${pageSlug}`;
  }
  if (!topicGroupSlug) {
    return `${USERS_ROOT}/${userId}/${subjectSlug}/${FILE_SEGMENT}/${pageSlug}`;
  }
  return `${USERS_ROOT}/${userId}/${subjectSlug}/${topicGroupSlug}/${pageSlug}`;
}

/** In-app reader path for a personal library page. */
export function pageHref(
  notebookSlug: string | null | undefined,
  topicSlug: string | null | undefined,
  pageSlug: string
): string {
  if (!notebookSlug) return `/my-content/file/${pageSlug}`;
  if (!topicSlug) return `/my-content/${notebookSlug}/file/${pageSlug}`;
  return `/my-content/${notebookSlug}/${topicSlug}/${pageSlug}`;
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
