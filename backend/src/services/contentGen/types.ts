import type { StudyGoal } from "@prisma/client";

export type DiagramKind =
  | "flow"
  | "compare"
  | "timeline"
  | "hierarchy"
  | "cycle"
  | "cards"
  | "none";

/**
 * One page as written in a blueprint file. Subject and topic placement come
 * from the enclosing StarterSubject / StarterTopic, so a spec only carries what
 * makes the page itself specific.
 */
export type StarterArticleSpec = {
  slug: string;
  title: string;
  /** Verbatim syllabus line this page exists to serve. */
  syllabusAnchor: string;
  /** Concrete points that must be genuinely explained — the recheck checklist. */
  mustCover: string[];
  /** Named comparisons, numericals or applications the page must work through. */
  worked?: string[];
  /** Errors candidates actually make on this topic. */
  traps?: string[];
  /** Official/primary references the writer must stay consistent with. */
  officialSources: string[];
  diagram: DiagramKind;
  /** SEO phrases to weave into title, description and headings. */
  keywords: string[];
  order?: number;
};

export type StarterTopic = {
  slug: string;
  title: string;
  articles: StarterArticleSpec[];
};

/** An exam subject or paper, e.g. "Indian Polity (GS Paper II)". */
export type StarterSubject = {
  slug: string;
  name: string;
  description: string;
  /** Paper label as the exam body words it, e.g. "GS Paper II". */
  paper?: string;
  topics: StarterTopic[];
};

export type StarterPackBlueprint = {
  studyGoal: StudyGoal;
  label: string;
  /** Exam context injected into every prompt: pattern, depth, register. */
  examContext: string;
  subjects: StarterSubject[];
};

/** A spec resolved against its subject and topic, ready to generate. */
export type ResolvedArticleSpec = StarterArticleSpec & {
  subjectSlug: string;
  subjectName: string;
  subjectDescription: string;
  paper?: string;
  topicSlug: string;
  topicTitle: string;
};

export type GeneratedTable = {
  caption: string;
  columns: string[];
  rows: string[][];
};

export type GeneratedSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  table?: GeneratedTable | null;
};

export type DiagramSpec = {
  kind: Exclude<DiagramKind, "none">;
  title: string;
  caption?: string;
  steps?: { label: string; detail?: string }[];
  rows?: { left: string; right: string }[];
  leftHeading?: string;
  rightHeading?: string;
};

/** Four-card "at a glance" figure — HTML illustration, not a raster image. */
export type GlanceFigure = {
  title: string;
  cards: { label: string; detail: string }[];
};

export type GeneratedArticle = {
  title: string;
  /** <=160 chars, used for Article.summary and the meta description. */
  metaDescription: string;
  intro: string;
  sections: GeneratedSection[];
  keyTakeaways: string[];
  examPointers: string[];
  /** Mistakes candidates make, phrased as correction not scolding. */
  commonMistakes: string[];
  /** Other syllabus areas this topic connects to. */
  linkages: string[];
  diagram: DiagramSpec | null;
  glance: GlanceFigure | null;
  keywords: string[];
};

export type RelevanceReview = {
  score: number;
  missing: string[];
  corrections: string[];
  /** Sections that read as filler rather than teaching. */
  vague: string[];
  verdict: "pass" | "revise";
};
