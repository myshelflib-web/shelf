import type { DiagramKind, StarterArticleSpec } from "../types.js";

/**
 * Compact syllabus leaf — one Learn page. Seeds become the recheck checklist.
 * Keep seeds specific and checkable; the generator expands them into the page.
 */
export type SyllabusLeaf = {
  slug: string;
  title: string;
  seeds: string[];
  diagram: DiagramKind;
  keywords: string[];
  worked?: string[];
  traps?: string[];
};

export type SyllabusTopic = {
  slug: string;
  title: string;
  syllabusAnchor: string;
  leaves: SyllabusLeaf[];
};

export type SyllabusSubject = {
  slug: string;
  name: string;
  description: string;
  paper?: string;
  sources: string[];
  topics: SyllabusTopic[];
};

/** Shorthand for a leaf so corpus files stay dense. */
export function L(
  slug: string,
  title: string,
  seeds: string[],
  diagram: DiagramKind,
  keywords: string[],
  extra?: Pick<SyllabusLeaf, "worked" | "traps">
): SyllabusLeaf {
  return { slug, title, seeds, diagram, keywords, ...extra };
}

export function topic(
  slug: string,
  title: string,
  syllabusAnchor: string,
  leaves: SyllabusLeaf[]
): SyllabusTopic {
  return { slug, title, syllabusAnchor, leaves };
}

export function leafToSpec(
  leaf: SyllabusLeaf,
  sources: string[],
  syllabusAnchor: string,
  order: number
): StarterArticleSpec {
  return {
    slug: leaf.slug,
    title: leaf.title,
    syllabusAnchor,
    mustCover: [...leaf.seeds],
    worked: leaf.worked,
    traps: leaf.traps,
    officialSources: sources,
    diagram: leaf.diagram,
    keywords: leaf.keywords,
    order,
  };
}
