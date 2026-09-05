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

export function officialSyllabusSubjectSlug(
  goalSlug: string
): string {
  return `${OFFICIAL_SYLLABUS_SUBJECT_PREFIX}${goalSlug}`;
}

/** Admin folder names that hold official exam syllabus PDFs. */
export function isSyllabusAdminSubject(segment: string): boolean {
  const s = segment.toLowerCase();
  return (
    s.startsWith("official-syllabus") ||
    s.endsWith("-official-syllabus") ||
    s === "syllabus-exam-pattern" ||
    s === "syllabus" ||
    /(^|-)syllabus(-|$)/.test(s)
  );
}
