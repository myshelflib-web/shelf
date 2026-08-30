import { hashSeed, LIVELY_LINE_ROTATE_MS } from "@/lib/livelyCopy";

export type LibrarySuggestChip = {
  id: string;
  label: string;
  query: string;
};

export const LIBRARY_SUGGEST_ROTATE_MS = LIVELY_LINE_ROTATE_MS;

export const LIBRARY_SUGGEST_COUNT = 6;

const LEARN_POOL: LibrarySuggestChip[] = [
  { id: "upsc-syl", label: "UPSC syllabus", query: "UPSC syllabus" },
  { id: "pcs", label: "State PCS", query: "State PCS" },
  { id: "judiciary", label: "Judiciary bare acts", query: "bare acts" },
  { id: "ca", label: "CA syllabus", query: "CA syllabus" },
  { id: "neet", label: "NEET PG syllabus", query: "NEET PG" },
  { id: "gate", label: "GATE syllabus", query: "GATE syllabus" },
  { id: "gate-pyq", label: "GATE PYQs", query: "GATE previous" },
  { id: "survey", label: "Economic Survey", query: "Economic Survey" },
  { id: "budget", label: "Union Budget", query: "Budget" },
  { id: "constitution", label: "Constitution", query: "Constitution" },
  { id: "ncert", label: "NCERT", query: "NCERT" },
  { id: "polity", label: "Polity", query: "Polity" },
  { id: "tnpsc", label: "TNPSC papers", query: "TNPSC" },
  { id: "rpsc", label: "RPSC papers", query: "Rajasthan" },
  { id: "ipc", label: "IPC", query: "IPC" },
  { id: "companies", label: "Companies Act", query: "Companies Act" },
  { id: "nmc", label: "NMC curriculum", query: "NMC" },
  { id: "open-tb", label: "Open textbooks", query: "open textbooks" },
  { id: "pyq", label: "Previous papers", query: "previous year" },
  { id: "yojana", label: "Yojana", query: "Yojana" },
  { id: "law-comm", label: "Law Commission", query: "Law Commission" },
  { id: "ini-cet", label: "INI-CET", query: "INI-CET" },
];

const LIBRARY_POOL: LibrarySuggestChip[] = [
  { id: "pdfs", label: "PDFs", query: "PDF" },
  { id: "notes", label: "Notes", query: "notes" },
  { id: "lectures", label: "Lectures", query: "lecture" },
  { id: "syllabus", label: "Syllabus", query: "syllabus" },
  { id: "chapter", label: "Chapters", query: "chapter" },
  { id: "papers", label: "Papers", query: "paper" },
  { id: "clips", label: "Clips", query: "clip" },
  { id: "youtube", label: "YouTube", query: "YouTube" },
  { id: "links", label: "Links", query: "link" },
  { id: "drafts", label: "Drafts", query: "draft" },
  { id: "reading", label: "Reading", query: "reading" },
  { id: "starred", label: "Starred", query: "starred" },
  { id: "summary", label: "Summaries", query: "summary" },
  { id: "assignment", label: "Assignments", query: "assignment" },
  { id: "worksheet", label: "Worksheets", query: "worksheet" },
  { id: "pyq", label: "Previous papers", query: "previous" },
];

export type SuggestSurface = "learn" | "library";

function poolFor(surface: SuggestSurface): LibrarySuggestChip[] {
  return surface === "learn" ? LEARN_POOL : LIBRARY_POOL;
}

function rotatePool<T>(pool: T[], offset: number, count: number): T[] {
  const n = Math.min(count, pool.length);
  const start = ((offset % pool.length) + pool.length) % pool.length;
  return [...pool.slice(start), ...pool.slice(0, start)].slice(0, n);
}

export function pickLibrarySuggestChips(
  surface: SuggestSurface,
  opts: {
    slot: number;
    sessionSeed?: string | number;
    count?: number;
  }
): LibrarySuggestChip[] {
  const pool = poolFor(surface);
  const count = Math.min(opts.count ?? LIBRARY_SUGGEST_COUNT, pool.length);
  const offset =
    (hashSeed("lib-suggest", surface, opts.sessionSeed ?? "shelf") +
      opts.slot) %
    pool.length;
  return rotatePool(pool, offset, count);
}
