import type { StudyGoal } from "@prisma/client";
import {
  blueprintForGoal,
  flattenBlueprint,
  STARTER_PACK_BLUEPRINTS,
} from "../blueprints/index.js";
import type { ResolvedArticleSpec } from "../types.js";
import { compileSubjects, mergeSyllabusSubjects } from "./compile.js";
import type { SyllabusSubject } from "./syllabusTypes.js";
import { UPSC_ECONOMY_CORPUS } from "./upscEconomy.js";
import { UPSC_POLITY_CORPUS } from "./upscPolity.js";
import { UPSC_HISTORY_CORPUS } from "./upscHistory.js";
import { UPSC_GEOGRAPHY_CORPUS } from "./upscGeography.js";
import { UPSC_ENVIRONMENT_CORPUS } from "./upscEnvironment.js";
import { UPSC_SOCIETY_IR_CORPUS } from "./upscSocietyIr.js";
import { UPSC_ETHICS_SCI_CSAT_CORPUS } from "./upscEthicsSciCsat.js";
import { STATE_PCS_CORPUS } from "./statePcs.js";
import { JUDICIARY_CORPUS } from "./judiciary.js";
import { CA_CORPUS } from "./ca.js";
import { NEET_PG_CORPUS } from "./neetPg.js";
import { GATE_CORPUS } from "./gate.js";
import { GENERAL_CORPUS } from "./general.js";

export const SYLLABUS_SUBJECTS = mergeSyllabusSubjects([
  ...UPSC_ECONOMY_CORPUS,
  ...UPSC_POLITY_CORPUS,
  ...UPSC_HISTORY_CORPUS,
  ...UPSC_GEOGRAPHY_CORPUS,
  ...UPSC_ENVIRONMENT_CORPUS,
  ...UPSC_SOCIETY_IR_CORPUS,
  ...UPSC_ETHICS_SCI_CSAT_CORPUS,
  ...STATE_PCS_CORPUS,
  ...JUDICIARY_CORPUS,
  ...CA_CORPUS,
  ...NEET_PG_CORPUS,
  ...GATE_CORPUS,
  ...GENERAL_CORPUS,
]);

const GOAL_BY_SLUG_PREFIX: Record<string, StudyGoal> = {
  "upsc-": "UPSC",
  "state-pcs-": "STATE_PCS",
  "judiciary-": "JUDICIARY",
  "ca-": "CA",
  "neet-pg-": "NEET_PG",
  "gate-": "GATE",
  "study-skills-": "GENERAL",
};

export function goalForSubjectSlug(slug: string): StudyGoal | null {
  for (const [prefix, goal] of Object.entries(GOAL_BY_SLUG_PREFIX)) {
    if (slug.startsWith(prefix)) return goal;
  }
  return null;
}

function corpusForGoal(goal: StudyGoal): SyllabusSubject[] {
  return SYLLABUS_SUBJECTS.filter((s) => goalForSubjectSlug(s.slug) === goal);
}

type GoalCatalog = {
  list: ResolvedArticleSpec[];
  byKey: Map<string, ResolvedArticleSpec>;
};

const GOAL_CATALOG = new Map<StudyGoal, GoalCatalog>();

function loadGoalCatalog(goal: StudyGoal): GoalCatalog {
  const hit = GOAL_CATALOG.get(goal);
  if (hit) return hit;

  const blueprint = blueprintForGoal(goal);
  const fromBlueprint = blueprint ? flattenBlueprint(blueprint) : [];
  const fromCorpus = compileSubjects(corpusForGoal(goal));
  const seen = new Set(fromBlueprint.map((s) => `${s.subjectSlug}/${s.slug}`));
  const list = [
    ...fromBlueprint,
    ...fromCorpus.filter((s) => !seen.has(`${s.subjectSlug}/${s.slug}`)),
  ];
  const byKey = new Map(list.map((s) => [`${s.subjectSlug}/${s.slug}`, s]));
  const catalog = { list, byKey };
  GOAL_CATALOG.set(goal, catalog);
  return catalog;
}

/**
 * Blueprint chapters first (richer checklists), then corpus leaves whose slug
 * is not already taken. Same subject slugs so pages land in one Learn tree.
 * Compiled once per process — do not mutate the returned array.
 */
export function specsForGoal(
  goal: StudyGoal,
  filter?: { subjectSlug?: string }
): ResolvedArticleSpec[] {
  const { list } = loadGoalCatalog(goal);
  if (filter?.subjectSlug) {
    return list.filter((s) => s.subjectSlug === filter.subjectSlug);
  }
  return list;
}

export function specForPage(
  goal: StudyGoal,
  subjectSlug: string,
  slug: string
): ResolvedArticleSpec | undefined {
  return loadGoalCatalog(goal).byKey.get(`${subjectSlug}/${slug}`);
}

export function catalogSubjectSlugs(): string[] {
  const fromBlueprints = STARTER_PACK_BLUEPRINTS.flatMap((b) =>
    b.subjects.map((s) => s.slug)
  );
  const fromCorpus = SYLLABUS_SUBJECTS.map((s) => s.slug);
  return [...new Set([...fromBlueprints, ...fromCorpus])];
}

export type CatalogPack = {
  studyGoal: StudyGoal;
  label: string;
  articleCount: number;
  subjects: {
    slug: string;
    name: string;
    paper: string | null;
    articleCount: number;
  }[];
};

export function catalogHasSubject(goal: StudyGoal, slug: string): boolean {
  const blueprint = blueprintForGoal(goal);
  if (blueprint?.subjects.some((s) => s.slug === slug)) return true;
  return corpusForGoal(goal).some((s) => s.slug === slug);
}

let packsCache: CatalogPack[] | null = null;

export function catalogPacks(): CatalogPack[] {
  if (packsCache) return packsCache;

  packsCache = STARTER_PACK_BLUEPRINTS.map((blueprint) => {
    const specs = specsForGoal(blueprint.studyGoal);
    const bySubject = new Map<
      string,
      { name: string; paper: string | null; count: number }
    >();

    for (const spec of specs) {
      const row = bySubject.get(spec.subjectSlug) ?? {
        name: spec.subjectName,
        paper: spec.paper ?? null,
        count: 0,
      };
      row.count += 1;
      bySubject.set(spec.subjectSlug, row);
    }

    // Keep blueprint subject order, then any corpus-only subjects.
    const orderedSlugs = [
      ...blueprint.subjects.map((s) => s.slug),
      ...[...bySubject.keys()].filter(
        (slug) => !blueprint.subjects.some((s) => s.slug === slug)
      ),
    ];

    return {
      studyGoal: blueprint.studyGoal,
      label: blueprint.label,
      articleCount: specs.length,
      subjects: orderedSlugs
        .map((slug) => {
          const row = bySubject.get(slug);
          if (!row) return null;
          return {
            slug,
            name: row.name,
            paper: row.paper,
            articleCount: row.count,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null),
    };
  });

  return packsCache;
}
