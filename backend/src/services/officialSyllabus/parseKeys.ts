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

function titleFromPart(part: string): string {
  const cleaned = part
    .replace(/\.pdf$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "Official syllabus";
  return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
}

function topicTitle(slug: string): string {
  if (slug === "official") return "Official PDFs";
  return titleFromPart(slug);
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
