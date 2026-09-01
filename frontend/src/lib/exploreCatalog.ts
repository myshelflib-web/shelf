import {
  countArticles,
  groupSubjectsByGoal,
  subjectGoal,
  subjectHref,
  topicHref,
} from "@/lib/learnCatalog";
import { learnHref } from "@/lib/learnContent";
import { StudyGoal, Subject } from "@/types";

export type ExploreAreaId =
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
    id: "exams",
    title: "Exams & certifications",
    description:
      "Syllabi, previous papers and reference material for structured preparation.",
    tone: "exam",
    goals: ["UPSC", "STATE_PCS", "GATE", "CA", "NEET_PG"],
  },
  {
    id: "law",
    title: "Law",
    description:
      "Bare Acts, Law Commission reports and legal reference material.",
    tone: "law",
    goals: ["JUDICIARY"],
  },
  {
    id: "medicine",
    title: "Medicine",
    description:
      "Curriculum resources, public textbooks and clinical references.",
    tone: "med",
    goals: ["NEET_PG"],
  },
  {
    id: "engineering",
    title: "Engineering",
    description:
      "Open technical material, references and certification resources.",
    tone: "eng",
    goals: ["GATE"],
  },
  {
    id: "policy",
    title: "Public Policy",
    description:
      "Government reports, policy documents and official publications.",
    tone: "policy",
    goals: ["UPSC", "STATE_PCS"],
  },
  {
    id: "books",
    title: "Open Textbooks",
    description: "Public learning material across subjects and disciplines.",
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
  if (goal === "JUDICIARY") return "law";
  if (goal === "NEET_PG") return "medicine";
  if (goal === "GATE") return "engineering";
  if (goal === "UPSC" || goal === "STATE_PCS") return "policy";
  if (goal === "CA") return "exams";
  return "exams";
}

export function subjectsForArea(
  subjects: Subject[],
  areaId: ExploreAreaId
): Subject[] {
  const goals = new Set(getExploreArea(areaId).goals);
  return subjects.filter((s) => goals.has(subjectGoal(s)));
}

export function countAreaItems(subjects: Subject[], areaId: ExploreAreaId): number {
  return countArticles(subjectsForArea(subjects, areaId));
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
};

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

export function collectionMeta(subject: Subject): string {
  const topics = subject.topics.length;
  const articles = subject.topics.reduce(
    (n, t) => n + (t.articles?.length ?? 0),
    0
  );
  const goal = subjectGoal(subject);
  if (goal === "UPSC" || goal === "STATE_PCS") {
    return "Syllabus · PYQs · reference material";
  }
  if (goal === "GATE") return "Syllabus · previous papers · references";
  if (goal === "JUDICIARY") return "Statutes · official reports";
  if (goal === "NEET_PG") return "Curriculum · medical references";
  if (goal === "CA") return "Accounting · statutes";
  if (goal === "GENERAL") return "Open textbooks · public courses";
  if (topics > 0 && articles > 0) {
    return `${topics} topic${topics === 1 ? "" : "s"} · ${articles} article${articles === 1 ? "" : "s"}`;
  }
  return subject.description?.trim() || "Preloaded collection";
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
