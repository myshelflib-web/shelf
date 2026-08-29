import type { QuizLaunch, QuizSourceKind } from "./types";

function asSource(raw: string | undefined): QuizSourceKind {
  const v = String(raw ?? "LIBRARY").toUpperCase();
  if (v === "UPLOAD" || v === "EXAM_BANK") return v;
  return "LIBRARY";
}

export function quizSetupHref(opts: QuizLaunch = {}): string {
  const q = new URLSearchParams();
  const source = asSource(opts.source);
  if (source !== "LIBRARY") q.set("source", source);
  const kind = String(opts.contextKind ?? "LIBRARY").toUpperCase();
  if (kind !== "LIBRARY") q.set("kind", kind);
  if (opts.notebookId) q.set("notebookId", opts.notebookId);
  if (opts.topicId) q.set("topicId", opts.topicId);
  if (opts.pageId) q.set("pageId", opts.pageId);
  if (opts.relevancyDocId) q.set("relevancyDocId", opts.relevancyDocId);
  if (opts.focus?.trim()) q.set("focus", opts.focus.trim());
  const qs = q.toString();
  return qs ? `/quiz?${qs}` : "/quiz";
}

export function quizHref(id: string): string {
  return `/quiz/${id}`;
}

export function quizHomeHref(tab: "new" | "past", launch?: QuizLaunch): string {
  if (tab === "past") return "/quiz?tab=past";
  return quizSetupHref(launch);
}

export function parseQuizSearch(search: URLSearchParams): QuizLaunch {
  return {
    source: search.get("source") ?? undefined,
    contextKind: search.get("kind") ?? undefined,
    notebookId: search.get("notebookId"),
    topicId: search.get("topicId"),
    pageId: search.get("pageId"),
    relevancyDocId: search.get("relevancyDocId"),
    focus: search.get("focus"),
  };
}

export const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
  EXAM: "Exam",
};

export const TIME_OPTIONS: Array<{ sec: number | null; label: string }> = [
  { sec: null, label: "No timer" },
  { sec: 300, label: "5 min" },
  { sec: 600, label: "10 min" },
  { sec: 900, label: "15 min" },
  { sec: 1200, label: "20 min" },
  { sec: 1800, label: "30 min" },
  { sec: 2700, label: "45 min" },
  { sec: 3600, label: "60 min" },
  { sec: 5400, label: "90 min" },
  { sec: 7200, label: "2 hours" },
];

export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
