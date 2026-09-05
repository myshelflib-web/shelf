import { ArticleSummary, StudyGoal, Subject, Topic } from "@/types";

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

/** Topic folders that hold official exam syllabus PDFs. */
export function isSyllabusTopic(topic: Pick<Topic, "slug" | "title">): boolean {
  return /syllabus/i.test(`${topic.slug} ${topic.title}`);
}

function isSyllabusArticle(
  article: Pick<ArticleSummary, "slug" | "title">
): boolean {
  return /syllabus/i.test(`${article.slug} ${article.title}`);
}

export function syllabusTopicsFromSubject(subject: Subject): Topic[] {
  return subject.topics
    .map((topic) => {
      if (isSyllabusTopic(topic)) {
        return (topic.articles?.length ?? 0) > 0 ? topic : null;
      }
      const articles = (topic.articles ?? []).filter(isSyllabusArticle);
      return articles.length > 0 ? { ...topic, articles } : null;
    })
    .filter((topic): topic is Topic => topic !== null);
}

function withPublishedTopics(subject: Subject): Subject {
  return {
    ...subject,
    topics: subject.topics.filter((topic) => (topic.articles?.length ?? 0) > 0),
  };
}

/**
 * Collections shown under Browse → Syllabus.
 * Dedicated official-syllabus folders plus exam collections that already
 * have a syllabus topic. General-track material is omitted.
 * When `goal` is an exam track, only that exam's syllabus is returned.
 */
export function syllabusBrowseSubjects(
  subjects: Subject[],
  goal?: StudyGoal
): Subject[] {
  const official = subjects
    .filter(isOfficialSyllabusSubject)
    .map(withPublishedTopics)
    .filter((subject) => subject.topics.length > 0);
  const officialGoals = new Set(
    official.map((subject) => subject.studyGoal ?? "GENERAL")
  );

  const derived = subjects
    .filter((subject) => !isOfficialSyllabusSubject(subject))
    .filter((subject) => (subject.studyGoal ?? "GENERAL") !== "GENERAL")
    .filter((subject) => !officialGoals.has(subject.studyGoal ?? "GENERAL"))
    .map((subject) => ({
      ...subject,
      topics: syllabusTopicsFromSubject(subject),
    }))
    .filter((subject) => subject.topics.length > 0);

  const all = [...official, ...derived];
  if (!goal || goal === "GENERAL") return all;
  return all.filter((subject) => (subject.studyGoal ?? "GENERAL") === goal);
}
