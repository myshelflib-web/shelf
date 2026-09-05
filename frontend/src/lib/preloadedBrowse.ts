import {
  ExploreAreaId,
  areaForSubject,
  isExploreAreaId,
  learnAreaHref,
} from "@/lib/exploreCatalog";
import { parseLearnPath, subjectHref, topicHref } from "@/lib/learnCatalog";
import { learnHref } from "@/lib/learnContent";
import { Subject } from "@/types";

export type PreloadedBrowsePath = {
  areaId?: ExploreAreaId | null;
  subjectSlug?: string;
  topicSlug?: string;
  articleSlug?: string;
};

/** Left pane always stays the Explore tree — only expand/collapse. */
export function preloadedExplorerMode(_opts?: {
  workspaceMode?: boolean;
  activeSubject?: string | null;
}): "home" | "collection" | "tree" {
  return "home";
}

export function browseHref(path: PreloadedBrowsePath): string {
  if (path.subjectSlug && path.topicSlug && path.articleSlug) {
    return learnHref(path.subjectSlug, path.topicSlug, path.articleSlug);
  }
  if (path.subjectSlug && path.topicSlug) {
    return topicHref(path.subjectSlug, path.topicSlug);
  }
  if (path.subjectSlug) return subjectHref(path.subjectSlug);
  if (path.areaId) return learnAreaHref(path.areaId);
  return "/learn";
}

export function browsePathFromHref(href: string): PreloadedBrowsePath {
  const raw = href.startsWith("http") ? new URL(href).pathname + new URL(href).search : href;
  const [pathPart, queryPart] = raw.split("?");
  const areaFromQuery = queryPart
    ? new URLSearchParams(queryPart).get("area")
    : null;
  const parsed = parseLearnPath(pathPart);
  return {
    areaId: isExploreAreaId(areaFromQuery) ? areaFromQuery : null,
    subjectSlug: parsed.subjectSlug,
    topicSlug: parsed.topicSlug,
    articleSlug: parsed.articleSlug,
  };
}

/** Area to expand in the left tree — explicit query, else the subject's track. */
export function resolveBrowseArea(
  path: PreloadedBrowsePath,
  subjects: Subject[]
): ExploreAreaId | null {
  if (path.areaId) return path.areaId;
  if (!path.subjectSlug) return null;
  const subject = subjects.find((s) => s.slug === path.subjectSlug);
  return subject ? areaForSubject(subject) : null;
}

export function withResolvedArea(
  path: PreloadedBrowsePath,
  subjects: Subject[]
): PreloadedBrowsePath {
  return {
    ...path,
    areaId: resolveBrowseArea(path, subjects),
  };
}

/** True when the current browse folder is this folder (not a child). */
export function isSameBrowseFolder(
  current: PreloadedBrowsePath,
  folder: PreloadedBrowsePath
): boolean {
  return (
    (current.areaId ?? null) === (folder.areaId ?? null) &&
    (current.subjectSlug ?? undefined) === (folder.subjectSlug ?? undefined) &&
    (current.topicSlug ?? undefined) === (folder.topicSlug ?? undefined) &&
    !current.articleSlug &&
    !folder.articleSlug
  );
}
