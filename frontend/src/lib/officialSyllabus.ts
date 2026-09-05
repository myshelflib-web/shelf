import { Subject } from "@/types";

/** Canonical Learn slugs for official exam syllabus PDFs from S3. */
export const OFFICIAL_SYLLABUS_SUBJECT_PREFIX = "official-syllabus-";

export function isOfficialSyllabusSubjectSlug(
  slug: string | null | undefined
): boolean {
  if (!slug) return false;
  return (
    slug.startsWith(OFFICIAL_SYLLABUS_SUBJECT_PREFIX) ||
    slug.endsWith("-official-syllabus") ||
    slug === "syllabus-exam-pattern"
  );
}

export function isOfficialSyllabusSubject(subject: Pick<Subject, "slug">): boolean {
  return isOfficialSyllabusSubjectSlug(subject.slug);
}
