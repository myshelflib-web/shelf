import type { StudyGoal } from "@prisma/client";
import { slugify } from "../../utils/slugify.js";
import { STUDY_GOAL_LABELS } from "../../studyGoal.js";
import {
  isSyllabusAdminSubject,
  officialSyllabusSubjectSlug,
} from "./slugs.js";

export type OfficialSyllabusPdf = {
  pdfKey: string;
  studyGoal: StudyGoal;
  subjectSlug: string;
  subjectName: string;
  topicSlug: string;
  topicTitle: string;
  articleSlug: string;
  title: string;
};

const GOAL_FROM_SEGMENT: Record<string, StudyGoal> = {
  upsc: "UPSC",
  "state-pcs": "STATE_PCS",
  state_pcs: "STATE_PCS",
  pcs: "STATE_PCS",
  judiciary: "JUDICIARY",
  law: "JUDICIARY",
  ca: "CA",
  icai: "CA",
  "neet-pg": "NEET_PG",
  neet_pg: "NEET_PG",
  neetpg: "NEET_PG",
  medicine: "NEET_PG",
  gate: "GATE",
  engineering: "GATE",
  general: "GENERAL",
};

const GOAL_SLUG: Record<StudyGoal, string> = {
  UPSC: "upsc",
  STATE_PCS: "state-pcs",
  JUDICIARY: "judiciary",
  CA: "ca",
  NEET_PG: "neet-pg",
  GATE: "gate",
  GENERAL: "general",
};

const SHORT_GOAL_NAME: Record<StudyGoal, string> = {
  UPSC: "UPSC CSE",
  STATE_PCS: "State PCS",
  JUDICIARY: "Judiciary",
  CA: "CA",
  NEET_PG: "NEET PG",
  GATE: "GATE",
  GENERAL: "General",
};

const PREFIXES = [
  "admin/official-syllabus/",
  "admin/syllabus/",
  "official-syllabus/",
  "syllabus/",
] as const;

const GATE_PAPER_NAME: Record<string, string> = {
  ae: "Aerospace Engineering",
  ag: "Agricultural Engineering",
  ar: "Architecture and Planning",
  bm: "Biomedical Engineering",
  bt: "Biotechnology",
  ce: "Civil Engineering",
  ch: "Chemical Engineering",
  cs: "Computer Science",
  cy: "Chemistry",
  da: "Data Science and AI",
  ec: "Electronics and Communication",
  ee: "Electrical Engineering",
  es: "Environmental Science",
  ey: "Ecology and Evolution",
  ge: "Geomatics Engineering",
  gg: "Geology and Geophysics",
  in: "Instrumentation Engineering",
  ma: "Mathematics",
  me: "Mechanical Engineering",
  mn: "Mining Engineering",
  mt: "Metallurgical Engineering",
  nm: "Naval Architecture",
  pe: "Petroleum Engineering",
  ph: "Physics",
  pi: "Production and Industrial",
  st: "Statistics",
  tf: "Textile Engineering",
  ga: "General Aptitude",
};

const SYLLABUS_TITLE: Record<string, string> = {
  "cse-2026": "Civil Services 2026",
  cse: "Civil Services (CSE)",
  "cds-i-2026": "CDS I 2026",
  "cds-ii-2026": "CDS II 2026",
  "capf-2026": "CAPF AC 2026",
  "nda-ii-2026": "NDA II 2026",
  "ies-iss-2026": "IES / ISS 2026",
  "ese-2026": "Engineering Services 2026",
  ese: "Engineering Services (ESE)",
  "cms-2026": "CMS 2026",
  "ifos-2026": "Indian Forest Service 2026",
  "djs-rules-2026": "Delhi Judicial Service Rules 2026",
  "dhjs-2026": "Delhi Higher Judicial Service 2026",
  djs: "Delhi Judicial Service",
  dhjs: "Delhi Higher Judicial Service",
  "rpsc-ras-pre-2024": "RPSC RAS Prelims 2024",
  "rpsc-ras-mains-2024": "RPSC RAS Mains 2024",
  cds: "CDS",
  capf: "CAPF",
  nda: "NDA",
  "ies-iss": "IES / ISS",
  cms: "CMS",
  ifos: "Indian Forest Service",
  rpsc: "RPSC RAS",
};

function titleFromPart(part: string): string {
  const cleaned = part
    .replace(/\.pdf$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "Official syllabus";
  const slug = cleaned.toLowerCase().replace(/\s+/g, "-");
  if (SYLLABUS_TITLE[slug]) return SYLLABUS_TITLE[slug];
  const code = cleaned.split(" ")[0]?.toLowerCase() ?? "";
  if (code === "cse") {
    const year = cleaned.replace(/^[a-z0-9]+\s*/i, "").trim();
    return year ? `Civil Services ${year}` : "Civil Services (CSE)";
  }
  if (GATE_PAPER_NAME[code]) {
    const year = cleaned.replace(/^[a-z0-9]+\s*/i, "").trim();
    return year ? `${GATE_PAPER_NAME[code]} ${year}` : GATE_PAPER_NAME[code];
  }
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}

function topicTitle(slug: string): string {
  if (slug === "official") return "Official PDFs";
  return SYLLABUS_TITLE[slug] ?? GATE_PAPER_NAME[slug] ?? titleFromPart(slug);
}

function goalFromSegment(segment: string): StudyGoal | null {
  const key = segment.toLowerCase().replace(/_/g, "-");
  return GOAL_FROM_SEGMENT[key] ?? null;
}

function goalFromSubjectSegment(segment: string): StudyGoal | null {
  const s = segment.toLowerCase();
  if (s === "syllabus-exam-pattern") return "UPSC";
  const stripped = s
    .replace(/^official-syllabus-/, "")
    .replace(/-official-syllabus$/, "")
    .replace(/-syllabus$/, "")
    .replace(/^syllabus-/, "");
  return goalFromSegment(stripped) ?? goalFromSegment(s);
}

function splitRest(
  rest: string
): { topicSlug: string; articleSlug: string; title: string } | null {
  const parts = rest.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  const last = parts[parts.length - 1] ?? "";
  if (!last.toLowerCase().endsWith(".pdf")) return null;

  const isSource = last.toLowerCase() === "source.pdf";
  if (isSource) {
    const folders = parts.slice(0, -1);
    if (folders.length === 0) return null;
    if (folders.length === 1) {
      const article = slugify(folders[0] ?? "") || "syllabus";
      return {
        topicSlug: "official",
        articleSlug: article,
        title: titleFromPart(folders[0] ?? article),
      };
    }
    const topic = slugify(folders[0] ?? "") || "official";
    const articlePart = folders[folders.length - 1] ?? "syllabus";
    const article = slugify(articlePart) || "syllabus";
    return {
      topicSlug: topic,
      articleSlug: article,
      title: titleFromPart(articlePart),
    };
  }

  const name = last.replace(/\.pdf$/i, "");
  const folders = parts.slice(0, -1);
  const topicSlug = folders[0] ? slugify(folders[0]) || "official" : "official";
  const articleSlug = slugify(name) || "syllabus";
  return { topicSlug, articleSlug, title: titleFromPart(name) };
}

function toRecord(
  pdfKey: string,
  goal: StudyGoal,
  rest: string
): OfficialSyllabusPdf | null {
  const split = splitRest(rest);
  if (!split) return null;
  const goalSlug = GOAL_SLUG[goal];
  return {
    pdfKey,
    studyGoal: goal,
    subjectSlug: officialSyllabusSubjectSlug(goalSlug),
    subjectName: SHORT_GOAL_NAME[goal] || STUDY_GOAL_LABELS[goal],
    topicSlug: split.topicSlug,
    topicTitle: topicTitle(split.topicSlug),
    articleSlug: split.articleSlug,
    title: split.title,
  };
}

/** Map an S3 object key to an official syllabus PDF, or null if it is not one. */
export function parseOfficialSyllabusKey(
  key: string
): OfficialSyllabusPdf | null {
  const pdfKey = key.replace(/^\/+/, "");
  if (!pdfKey.toLowerCase().endsWith(".pdf")) return null;
  if (pdfKey.startsWith("users/")) return null;

  for (const prefix of PREFIXES) {
    if (!pdfKey.toLowerCase().startsWith(prefix)) continue;
    const rest = pdfKey.slice(prefix.length);
    const [first, ...tail] = rest.split("/").filter(Boolean);
    if (!first) return null;
    const goal = goalFromSegment(first);
    if (goal) return toRecord(pdfKey, goal, tail.join("/"));
    if (prefix.endsWith("syllabus/") && first.toLowerCase().endsWith(".pdf")) {
      const fromName = goalFromSegment(
        first.replace(/\.pdf$/i, "").replace(/[-_]+syllabus$/i, "")
      );
      if (fromName) return toRecord(pdfKey, fromName, first);
    }
  }

  if (pdfKey.startsWith("admin/")) {
    const afterAdmin = pdfKey.slice("admin/".length);
    const [subjectSeg, ...restParts] = afterAdmin.split("/").filter(Boolean);
    if (!subjectSeg || !isSyllabusAdminSubject(subjectSeg)) return null;
    const goal = goalFromSubjectSegment(subjectSeg);
    if (!goal) return null;
    return toRecord(pdfKey, goal, restParts.join("/"));
  }

  return null;
}

export function parseOfficialSyllabusKeys(keys: string[]): OfficialSyllabusPdf[] {
  const seen = new Set<string>();
  const out: OfficialSyllabusPdf[] = [];
  for (const key of keys) {
    const parsed = parseOfficialSyllabusKey(key);
    if (!parsed) continue;
    const id = `${parsed.subjectSlug}/${parsed.topicSlug}/${parsed.articleSlug}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(parsed);
  }
  return out;
}

export const SYLLABUS_S3_PREFIXES: readonly string[] = PREFIXES;
