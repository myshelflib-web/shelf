import { catalogSubjectSlugs } from "./syllabus/index.js";
import { isOfficialSyllabusSubjectSlug } from "../officialSyllabus/slugs.js";

/** Live current-affairs briefs sit beside generated packs, not in the syllabus catalog. */
export function isPublicLearnSubject(slug: string): boolean {
  if (slug.startsWith("exam-briefs-")) return true;
  if (isOfficialSyllabusSubjectSlug(slug)) return true;
  return catalogSubjectSlugs().includes(slug);
}

/** Prisma `where` for the public Learn list — generated packs + news briefs + official syllabi. */
export function publicLearnSubjectWhere() {
  return {
    OR: [
      { slug: { in: catalogSubjectSlugs() } },
      { slug: { startsWith: "exam-briefs-" } },
      { slug: { startsWith: "official-syllabus-" } },
      { slug: { endsWith: "-official-syllabus" } },
      { slug: "syllabus-exam-pattern" },
    ],
  };
}
