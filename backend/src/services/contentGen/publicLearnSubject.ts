import { catalogSubjectSlugs } from "./syllabus/index.js";

/** Live current-affairs briefs sit beside generated packs, not in the syllabus catalog. */
export function isPublicLearnSubject(slug: string): boolean {
  if (slug.startsWith("exam-briefs-")) return true;
  return catalogSubjectSlugs().includes(slug);
}

/** Prisma `where` for the public Learn list — generated packs + news briefs only. */
export function publicLearnSubjectWhere() {
  return {
    OR: [
      { slug: { in: catalogSubjectSlugs() } },
      { slug: { startsWith: "exam-briefs-" } },
    ],
  };
}
