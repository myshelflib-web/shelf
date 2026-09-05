import { learnHref } from "@/lib/learnContent";
import { isOfficialSyllabusSubject } from "@/lib/officialSyllabus";
import { LEARN_CATALOG_GOAL_LABELS } from "@/lib/studyGoal";
import { Subject, StudyGoal } from "@/types";

export const LEARN_TRACK_ORDER: StudyGoal[] = [
  "UPSC",
  "STATE_PCS",
  "JUDICIARY",
  "CA",
  "NEET_PG",
  "GATE",
  "GENERAL",
];

export function catalogGoalLabel(goal: StudyGoal | undefined): string {
  if (!goal) return "Curriculum";
  return LEARN_CATALOG_GOAL_LABELS[goal] ?? goal;
}

export function subjectGoal(subject: Subject): StudyGoal {
  return subject.studyGoal ?? "GENERAL";
}

/** Shown on every study track, not only General. */
export const LEARNING_SCIENCE_SUBJECT_SLUG = "study-skills-learning";

export function isCrossGoalLearnSubject(subject: Subject): boolean {
  return subject.slug === LEARNING_SCIENCE_SUBJECT_SLUG;
}

/** Catalog subjects visible for a study track (General = non-exam only). */
export function subjectsForCatalogGoal(
  subjects: Subject[],
  goal: StudyGoal
): Subject[] {
  return subjects.filter((s) => {
    if (isCrossGoalLearnSubject(s)) return true;
    if (isOfficialSyllabusSubject(s)) return true;
    if (goal === "GENERAL") return subjectGoal(s) === "GENERAL";
    return subjectGoal(s) === goal;
  });
}

export function subjectMatchesCatalogGoal(
  subject: Subject,
  goal: StudyGoal
): boolean {
  return subjectsForCatalogGoal([subject], goal).length > 0;
}

export function matchesSearch(subject: Subject, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  if (subject.name.toLowerCase().includes(needle)) return true;
  return subject.topics.some(
    (t) =>
      t.title.toLowerCase().includes(needle) ||
      (t.articles ?? []).some((a) => a.title.toLowerCase().includes(needle))
  );
}

export function countArticles(subjects: Subject[]): number {
  return subjects.reduce(
    (total, subject) =>
      total +
      subject.topics.reduce((n, t) => n + (t.articles?.length ?? 0), 0),
    0
  );
}

export function countTopics(subjects: Subject[]): number {
  return subjects.reduce((n, s) => n + s.topics.length, 0);
}

export type GoalGroup = { goal: StudyGoal; subjects: Subject[] };

export function groupSubjectsByGoal(
  subjects: Subject[],
  featured?: StudyGoal | null
): GoalGroup[] {
  const buckets = new Map<StudyGoal, Subject[]>();
  for (const subject of subjects) {
    const goal = subjectGoal(subject);
    const list = buckets.get(goal) ?? [];
    list.push(subject);
    buckets.set(goal, list);
  }

  return [...buckets.keys()]
    .sort((a, b) => {
      if (featured && a === featured) return -1;
      if (featured && b === featured) return 1;
      return LEARN_TRACK_ORDER.indexOf(a) - LEARN_TRACK_ORDER.indexOf(b);
    })
    .map((goal) => ({ goal, subjects: buckets.get(goal) ?? [] }));
}

/** Prefer the opened collection's track, else the catalog filter. */
export function featuredGoalFor(
  filterGoal: StudyGoal,
  activeSubject?: Subject | null
): StudyGoal | undefined {
  if (activeSubject) return subjectGoal(activeSubject);
  if (filterGoal !== "GENERAL") return filterGoal;
  return undefined;
}

/** First URL segments under /learn that are not catalog subjects. */
const LEARN_RESERVED_SEGMENTS = new Set(["tracks", "current-affairs"]);

export function parseLearnPath(href?: string | null): {
  subjectSlug?: string;
  topicSlug?: string;
  articleSlug?: string;
} {
  if (!href) return {};
  const path = (href.split("?")[0] ?? href).replace(/\/$/, "");
  const match = path.match(
    /^\/learn(?:\/([^/]+))?(?:\/([^/]+))?(?:\/([^/]+))?$/
  );
  if (!match?.[1] || LEARN_RESERVED_SEGMENTS.has(match[1])) return {};
  return {
    subjectSlug: match[1],
    topicSlug: match[2],
    articleSlug: match[3],
  };
}

export function subjectHref(subjectSlug: string): string {
  return `/learn/${subjectSlug}`;
}

export function topicHref(subjectSlug: string, topicSlug: string): string {
  return `/learn/${subjectSlug}/${topicSlug}`;
}

export type LearnSearchHit = {
  id: string;
  title: string;
  href: string;
  snippet: string;
};

/** Local catalog search — not Study AI. */
export function searchLearnCatalog(
  subjects: Subject[],
  q: string
): LearnSearchHit[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  const hits: LearnSearchHit[] = [];
  for (const subject of subjects) {
    if (subject.name.toLowerCase().includes(needle)) {
      hits.push({
        id: subject.id,
        title: subject.name,
        href: subjectHref(subject.slug),
        snippet: "Collection",
      });
    }
    for (const topic of subject.topics) {
      if (topic.title.toLowerCase().includes(needle)) {
        hits.push({
          id: topic.id,
          title: topic.title,
          href: topicHref(subject.slug, topic.slug),
          snippet: subject.name,
        });
      }
      for (const article of topic.articles ?? []) {
        if (!article.title.toLowerCase().includes(needle)) continue;
        hits.push({
          id: article.id,
          title: article.title,
          href: learnHref(subject.slug, topic.slug, article.slug),
          snippet: `${subject.name} · ${topic.title}`,
        });
      }
    }
  }
  return hits.slice(0, 12);
}
