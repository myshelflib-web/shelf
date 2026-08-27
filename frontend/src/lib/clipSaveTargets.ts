import type { UserPageSummary, UserSubject } from "@/types";
import { getNotebookPages, getTopicGroups } from "@/lib/myContentTree";

const NOTE_TYPES = new Set(["HTML", "MARKDOWN", "TEXT", "DOCX"]);

export type ClipTarget = {
  id: string;
  title: string;
  slug: string;
  notebookSlug: string | null;
  notebookName: string | null;
  topicSlug: string | null;
  topicTitle: string | null;
};

export function isClipNotePage(page: UserPageSummary) {
  if (page.contentType === "PDF" || page.contentType === "LINK") return false;
  if (page.contentType == null) return true;
  return NOTE_TYPES.has(page.contentType);
}

export function clipTargetsFromSubject(nb: UserSubject): ClipTarget[] {
  const loose = getNotebookPages(nb).filter(isClipNotePage).map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    notebookSlug: nb.slug,
    notebookName: nb.name,
    topicSlug: null,
    topicTitle: null,
  }));
  const fromTopics = getTopicGroups(nb).flatMap((g) =>
    g.pages.filter(isClipNotePage).map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      notebookSlug: nb.slug,
      notebookName: nb.name,
      topicSlug: g.slug,
      topicTitle: g.title,
    }))
  );
  return [...loose, ...fromTopics];
}

export function clipTargetsFromRootPages(pages: UserPageSummary[]): ClipTarget[] {
  return pages.filter(isClipNotePage).map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    notebookSlug: null,
    notebookName: null,
    topicSlug: null,
    topicTitle: null,
  }));
}

export function mergeClipTargets(...lists: ClipTarget[][]): ClipTarget[] {
  const seen = new Set<string>();
  const out: ClipTarget[] = [];
  for (const list of lists) {
    for (const t of list) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      out.push(t);
    }
  }
  return out;
}

export function groupClipTargets(
  targets: ClipTarget[]
): { key: string; label: string; pages: ClipTarget[] }[] {
  const groups: { key: string; label: string; pages: ClipTarget[] }[] = [];
  const index = new Map<string, number>();
  for (const t of targets) {
    const key = t.notebookSlug ?? "__library__";
    const label = t.notebookName ?? "Library";
    let i = index.get(key);
    if (i == null) {
      i = groups.length;
      index.set(key, i);
      groups.push({ key, label, pages: [] });
    }
    groups[i].pages.push(t);
  }
  return groups;
}

export function clipTargetLabel(t: ClipTarget) {
  if (t.topicTitle) return `${t.topicTitle} / ${t.title}`;
  return t.title;
}
