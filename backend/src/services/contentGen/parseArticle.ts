import { asString, asStringArray, parseJsonObject } from "./jsonExtract.js";
import type {
  DiagramSpec,
  GeneratedArticle,
  GeneratedSection,
  GeneratedTable,
  GlanceFigure,
  RelevanceReview,
} from "./types.js";

const DIAGRAM_KINDS = [
  "flow",
  "compare",
  "timeline",
  "hierarchy",
  "cycle",
  "cards",
] as const;

function parseDiagram(value: unknown): DiagramSpec | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const kind = asString(raw.kind).toLowerCase();
  if (!DIAGRAM_KINDS.includes(kind as (typeof DIAGRAM_KINDS)[number])) return null;

  const steps = Array.isArray(raw.steps)
    ? raw.steps
        .map((s) => {
          const step = s as Record<string, unknown>;
          return { label: asString(step?.label), detail: asString(step?.detail) };
        })
        .filter((s) => s.label)
        .slice(0, 8)
    : [];

  const rows = Array.isArray(raw.rows)
    ? raw.rows
        .map((r) => {
          const row = r as Record<string, unknown>;
          return { left: asString(row?.left), right: asString(row?.right) };
        })
        .filter((r) => r.left || r.right)
        .slice(0, 8)
    : [];

  if (kind === "compare" ? rows.length < 2 : steps.length < 2) return null;

  return {
    kind: kind as DiagramSpec["kind"],
    title: asString(raw.title, "Diagram"),
    caption: asString(raw.caption) || undefined,
    steps: steps.length ? steps : undefined,
    rows: rows.length ? rows : undefined,
    leftHeading: asString(raw.leftHeading) || undefined,
    rightHeading: asString(raw.rightHeading) || undefined,
  };
}

function parseTable(value: unknown): GeneratedTable | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const columns = asStringArray(raw.columns, 6);
  if (columns.length < 2) return null;

  const rows = (Array.isArray(raw.rows) ? raw.rows : [])
    .map((r) => (Array.isArray(r) ? asStringArray(r, columns.length) : []))
    .filter((r) => r.some(Boolean))
    // Pad short rows so the rendered table stays rectangular.
    .map((r) => columns.map((_, i) => r[i] ?? ""))
    .slice(0, 10);
  if (rows.length < 2) return null;

  return { caption: asString(raw.caption), columns, rows };
}

function parseSections(value: unknown): GeneratedSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((s) => {
      const section = s as Record<string, unknown>;
      const paragraphs = asStringArray(section?.paragraphs, 10);
      const bullets = asStringArray(section?.bullets, 10);
      return {
        heading: asString(section?.heading),
        paragraphs,
        bullets: bullets.length ? bullets : undefined,
        table: parseTable(section?.table),
      };
    })
    .filter((s) => s.heading && (s.paragraphs.length > 0 || (s.bullets?.length ?? 0) > 0))
    .slice(0, 14);
}

function parseGlance(value: unknown): GlanceFigure | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const cards = (Array.isArray(raw.cards) ? raw.cards : [])
    .map((c) => {
      const card = c as Record<string, unknown>;
      return { label: asString(card?.label), detail: asString(card?.detail) };
    })
    .filter((c) => c.label)
    .slice(0, 6);
  if (cards.length < 3) return null;
  return { title: asString(raw.title, "At a glance"), cards };
}

export function parseGeneratedArticle(raw: string): GeneratedArticle | null {
  const obj = parseJsonObject<Record<string, unknown>>(raw);
  if (!obj) return null;

  const sections = parseSections(obj.sections);
  const title = asString(obj.title);
  if (!title || sections.length < 3) return null;

  return {
    title,
    metaDescription: asString(obj.metaDescription).slice(0, 300),
    intro: asString(obj.intro),
    sections,
    keyTakeaways: asStringArray(obj.keyTakeaways, 10),
    examPointers: asStringArray(obj.examPointers, 10),
    commonMistakes: asStringArray(obj.commonMistakes, 8),
    linkages: asStringArray(obj.linkages, 6),
    diagram: parseDiagram(obj.diagram),
    glance: parseGlance(obj.glance),
    keywords: asStringArray(obj.keywords, 12),
  };
}

export function parseRelevanceReview(raw: string): RelevanceReview | null {
  const obj = parseJsonObject<Record<string, unknown>>(raw);
  if (!obj) return null;

  const scoreRaw = Number(obj.score);
  const score = Number.isFinite(scoreRaw)
    ? Math.max(0, Math.min(100, Math.round(scoreRaw)))
    : 0;
  const missing = asStringArray(obj.missing, 12);
  const corrections = asStringArray(obj.corrections, 12);
  const vague = asStringArray(obj.vague, 12);
  const verdictRaw = asString(obj.verdict).toLowerCase();
  const clean = corrections.length === 0 && vague.length === 0;
  const verdict: RelevanceReview["verdict"] =
    verdictRaw === "pass" && score >= 85 && clean ? "pass" : "revise";

  return { score, missing, corrections, vague, verdict };
}

export function articleWordCount(article: GeneratedArticle): number {
  const text = [
    article.intro,
    ...article.sections.flatMap((s) => [
      ...s.paragraphs,
      ...(s.bullets ?? []),
      ...(s.table?.rows.flat() ?? []),
    ]),
    ...article.keyTakeaways,
    ...article.examPointers,
    ...article.commonMistakes,
  ].join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}
