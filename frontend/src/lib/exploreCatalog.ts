import {
  LEARNING_SCIENCE_SUBJECT_SLUG,
  countArticles,
  groupSubjectsByGoal,
  subjectGoal,
  subjectHref,
  topicHref,
} from "@/lib/learnCatalog";
import { learnHref } from "@/lib/learnContent";
import { StudyGoal, Subject } from "@/types";

export type ExploreAreaId =
  | "upsc"
  | "exams"
  | "law"
  | "medicine"
  | "engineering"
  | "policy"
  | "books";

export type ExploreAreaTone =
  | "exam"
  | "law"
  | "med"
  | "eng"
  | "policy"
  | "books";

export type ExploreAreaDef = {
  id: ExploreAreaId;
  title: string;
  description: string;
  tone: ExploreAreaTone;
  goals: StudyGoal[];
};

export const EXPLORE_AREAS: ExploreAreaDef[] = [
  {
    id: "upsc",
    title: "UPSC CSE",
    description: "Generated GS papers for Prelims and Mains.",
    tone: "policy",
    goals: ["UPSC"],
  },
  {
    id: "exams",
    title: "Exams & certifications",
    description: "Generated notes for State PCS and CA.",
    tone: "exam",
    goals: ["STATE_PCS", "CA"],
  },
  {
    id: "law",
    title: "Law",
    description: "Generated notes for judicial service exams.",
    tone: "law",
    goals: ["JUDICIARY"],
  },
  {
    id: "medicine",
    title: "Medicine",
    description: "Generated notes for NEET PG and INI-CET.",
    tone: "med",
    goals: ["NEET_PG"],
  },
  {
    id: "engineering",
    title: "Engineering",
    description: "Generated notes for GATE papers.",
    tone: "eng",
    goals: ["GATE"],
  },
  {
    id: "policy",
    title: "Public Policy",
    description: "Generated notes for policy and governance papers.",
    tone: "policy",
    goals: [],
  },
  {
    id: "books",
    title: "Study skills",
    description: "Evidence-based learning and exam craft.",
    tone: "books",
    goals: ["GENERAL"],
  },
];

const AREA_BY_ID = Object.fromEntries(
  EXPLORE_AREAS.map((a) => [a.id, a])
) as Record<ExploreAreaId, ExploreAreaDef>;

export function isExploreAreaId(value: string | null | undefined): value is ExploreAreaId {
  return Boolean(value && value in AREA_BY_ID);
}

export function getExploreArea(id: ExploreAreaId): ExploreAreaDef {
  return AREA_BY_ID[id];
}

/** Map a study track to the best-matching browse area. */
export function areaForGoal(goal: StudyGoal): ExploreAreaId {
  if (goal === "UPSC") return "upsc";
  if (goal === "JUDICIARY") return "law";
  if (goal === "NEET_PG") return "medicine";
  if (goal === "GATE") return "engineering";
  if (goal === "GENERAL") return "books";
  return "exams";
}

export function subjectsForArea(
  subjects: Subject[],
  areaId: ExploreAreaId
): Subject[] {
  const goals = new Set(getExploreArea(areaId).goals);
  return subjects
    .filter((s) => goals.has(subjectGoal(s)))
    .sort(
      (a, b) =>
        (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)
    );
}

/** Goal-specific labels for the collection grid inside a browse area. */
export function areaGroupsSection(areaId: ExploreAreaId): {
  title: string;
  copy: string;
} {
  switch (areaId) {
    case "upsc":
      return {
        title: "Paper collections",
        copy: "Each collection is one GS paper — open it to browse topics, then articles.",
      };
    case "medicine":
      return {
        title: "Curriculum groups",
        copy: "Pre-clinical, clinical, and exam-strategy modules for NEET PG and INI-CET.",
      };
    case "exams":
      return {
        title: "Exam tracks",
        copy: "State PCS and CA collections — open a track to see topics and articles.",
      };
    case "law":
      return {
        title: "Law collections",
        copy: "Statutes and official reports grouped by subject.",
      };
    case "engineering":
      return {
        title: "GATE papers",
        copy: "Discipline-wise GATE collections with syllabus and previous papers.",
      };
    case "books":
      return {
        title: "Skill modules",
        copy: "Learning science and exam-craft chapters.",
      };
    default:
      return {
        title: "Collections",
        copy: "Open a collection to browse topics, then articles.",
      };
  }
}

export function countAreaItems(subjects: Subject[], areaId: ExploreAreaId): number {
  return countArticles(subjectsForArea(subjects, areaId));
}

/** Home and sidebar only list areas that currently have published pages. */
export function visibleExploreAreas(subjects: Subject[]): ExploreAreaDef[] {
  return EXPLORE_AREAS.filter((area) => countAreaItems(subjects, area.id) > 0);
}

/** General track users only see non-exam browse areas (e.g. study skills). */
export function visibleExploreAreasForGoal(
  subjects: Subject[],
  goal: StudyGoal
): ExploreAreaDef[] {
  const areas = visibleExploreAreas(subjects);
  if (goal !== "GENERAL") {
    return areas.filter((area) => area.goals.includes(goal));
  }
  return areas.filter((area) => area.goals.includes("GENERAL"));
}

export function catalogGoalAllowsArea(
  areaId: ExploreAreaId,
  goal: StudyGoal
): boolean {
  const area = getExploreArea(areaId);
  if (goal === "GENERAL") return area.goals.includes("GENERAL");
  return area.goals.includes(goal);
}

export type ExploreResource = {
  id: string;
  title: string;
  href: string;
  typeLabel: string;
  meta: string;
  copy: string;
  subjectSlug: string;
  topicSlug: string;
  updatedAt?: string | null;
};

/** Human-readable last-updated label for explore article cards. */
export function formatArticleUpdatedAt(iso?: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function articleTypeLabel(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("syllabus")) return "Syllabus";
  if (lower.includes("previous") || lower.includes("pyq")) return "PYQ";
  if (lower.includes("act") || lower.includes("code")) return "Bare Act";
  if (lower.includes("report")) return "Report";
  if (lower.includes("curriculum") || lower.includes("cbme")) return "Curriculum";
  if (lower.includes("textbook") || lower.includes("text book")) return "Textbook";
  if (lower.includes("survey") || lower.includes("budget")) return "Report";
  if (lower.includes("policy")) return "Policy";
  return "Reference";
}

export function listAreaResources(
  subjects: Subject[],
  areaId: ExploreAreaId,
  opts?: { subjectSlug?: string; topicSlug?: string; query?: string }
): ExploreResource[] {
  const needle = opts?.query?.trim().toLowerCase() ?? "";
  const inArea = subjectsForArea(subjects, areaId);
  const scopedSubjects = opts?.subjectSlug
    ? inArea.filter((s) => s.slug === opts.subjectSlug)
    : inArea;

  const resources: ExploreResource[] = [];
  for (const subject of scopedSubjects) {
    for (const topic of subject.topics) {
      if (opts?.topicSlug && topic.slug !== opts.topicSlug) continue;
      for (const article of topic.articles ?? []) {
        if (
          needle &&
          !article.title.toLowerCase().includes(needle) &&
          !topic.title.toLowerCase().includes(needle) &&
          !subject.name.toLowerCase().includes(needle)
        ) {
          continue;
        }
        resources.push({
          id: article.id,
          title: article.title,
          href: learnHref(subject.slug, topic.slug, article.slug),
          typeLabel: articleTypeLabel(article.title),
          meta: `${subject.name} · ${topic.title}`,
          copy: "Open this public resource inside Shelf, then save a copy to your own Library if it is useful.",
          subjectSlug: subject.slug,
          topicSlug: topic.slug,
          updatedAt: article.updatedAt ?? null,
        });
      }
    }
  }
  return resources;
}

export function areaSidebarRows(
  subjects: Subject[],
  areaId: ExploreAreaId
): { slug: string; title: string; count: number }[] {
  return subjectsForArea(subjects, areaId).map((subject) => ({
    slug: subject.slug,
    title: subject.name,
    count: subject.topics.reduce((n, t) => n + (t.articles?.length ?? 0), 0),
  }));
}

/** Featured collections for the home grid — prefer track-backed subjects with content. */
export function featuredExploreCollections(subjects: Subject[]): Subject[] {
  const withArticles = subjects.filter(
    (s) => s.topics.some((t) => (t.articles?.length ?? 0) > 0)
  );
  const preferredGoals: StudyGoal[] = [
    "UPSC",
    "GATE",
    "JUDICIARY",
    "NEET_PG",
    "STATE_PCS",
    "CA",
  ];
  const picked: Subject[] = [];
  const seen = new Set<string>();

  const preferredSlugs = [
    "study-skills-learning",
    "study-skills-exam-craft",
    "upsc-polity",
    "upsc-economy",
  ];
  for (const slug of preferredSlugs) {
    const match = withArticles.find((s) => s.slug === slug && !seen.has(s.id));
    if (match) {
      picked.push(match);
      seen.add(match.id);
    }
    if (picked.length >= 4) break;
  }

  for (const goal of preferredGoals) {
    const match = withArticles.find(
      (s) => subjectGoal(s) === goal && !seen.has(s.id)
    );
    if (match) {
      picked.push(match);
      seen.add(match.id);
    }
    if (picked.length >= 4) break;
  }

  for (const subject of withArticles) {
    if (picked.length >= 4) break;
    if (seen.has(subject.id)) continue;
    picked.push(subject);
    seen.add(subject.id);
  }

  return picked;
}

/** General track users only see non-exam public collections. */
export function featuredExploreCollectionsForGoal(
  subjects: Subject[],
  goal: StudyGoal
): Subject[] {
  const featured = featuredExploreCollections(subjects);
  const scoped =
    goal === "GENERAL"
      ? featured.filter((s) => subjectGoal(s) === "GENERAL")
      : featured;
  const skills = subjects.find(
    (s) =>
      s.slug === LEARNING_SCIENCE_SUBJECT_SLUG &&
      s.topics.some((t) => (t.articles?.length ?? 0) > 0)
  );
  if (!skills || scoped.some((s) => s.id === skills.id)) return scoped;
  return [skills, ...scoped];
}

export function collectionMeta(subject: Subject): string {
  const topics = subject.topics.length;
  const articles = subject.topics.reduce(
    (n, t) => n + (t.articles?.length ?? 0),
    0
  );
  const counts =
    topics > 0 && articles > 0
      ? `${topics} topic${topics === 1 ? "" : "s"} · ${articles} article${articles === 1 ? "" : "s"}`
      : null;
  const goal = subjectGoal(subject);
  if (goal === "UPSC" || goal === "STATE_PCS") {
    return counts ? `${counts} · GS paper` : "GS paper collection";
  }
  if (goal === "GATE") {
    return counts ? `${counts} · GATE paper` : "GATE paper collection";
  }
  if (goal === "JUDICIARY") {
    return counts ? `${counts} · statutes & reports` : "Statutes · official reports";
  }
  if (goal === "NEET_PG") {
    return counts ? `${counts} · NEET PG module` : "NEET PG curriculum module";
  }
  if (goal === "CA") {
    return counts ? `${counts} · CA track` : "Accounting · statutes";
  }
  if (goal === "GENERAL") {
    return counts ? `${counts} · study skills` : "Study skills · exam craft";
  }
  if (counts) return counts;
  return subject.description?.trim() || "Generated collection";
}

export function exploreGroupsForHome(subjects: Subject[]) {
  return groupSubjectsByGoal(subjects);
}

export function subjectExploreHref(subjectSlug: string): string {
  return subjectHref(subjectSlug);
}

export function topicExploreHref(subjectSlug: string, topicSlug: string): string {
  return topicHref(subjectSlug, topicSlug);
}

export function learnAreaHref(areaId: ExploreAreaId): string {
  return `/learn?area=${areaId}`;
}
