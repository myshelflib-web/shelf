import type { ResolvedArticleSpec, StarterSubject } from "../types.js";
import { leafToSpec, type SyllabusSubject } from "./syllabusTypes.js";

export function compileSubject(subject: SyllabusSubject): StarterSubject {
  let order = 0;
  return {
    slug: subject.slug,
    name: subject.name,
    description: subject.description,
    paper: subject.paper,
    topics: subject.topics.map((t) => ({
      slug: t.slug,
      title: t.title,
      articles: t.leaves.map((leaf) =>
        leafToSpec(leaf, subject.sources, t.syllabusAnchor, order++)
      ),
    })),
  };
}

export function compileSubjects(subjects: SyllabusSubject[]): ResolvedArticleSpec[] {
  const specs: ResolvedArticleSpec[] = [];
  for (const subject of subjects) {
    for (const t of subject.topics) {
      t.leaves.forEach((leaf, i) => {
        specs.push({
          ...leafToSpec(leaf, subject.sources, t.syllabusAnchor, i),
          subjectSlug: subject.slug,
          subjectName: subject.name,
          subjectDescription: subject.description,
          paper: subject.paper,
          topicSlug: t.slug,
          topicTitle: t.title,
        });
      });
    }
  }
  return specs;
}

/** Same slug → concatenate topics so a subject can live in several files. */
export function mergeSyllabusSubjects(
  parts: SyllabusSubject[]
): SyllabusSubject[] {
  const map = new Map<string, SyllabusSubject>();
  for (const part of parts) {
    const existing = map.get(part.slug);
    if (!existing) {
      map.set(part.slug, { ...part, topics: [...part.topics] });
    } else {
      existing.topics.push(...part.topics);
    }
  }
  return [...map.values()];
}
