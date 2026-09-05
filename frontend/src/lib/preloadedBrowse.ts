import {
  ExploreAreaId,
  areaForGoal,
  isExploreAreaId,
  learnAreaHref,
} from "@/lib/exploreCatalog";
import { parseLearnPath, subjectGoal, subjectHref, topicHref } from "@/lib/learnCatalog";
import { Subject } from "@/types";

export type PreloadedBrowsePath = {
  areaId?: ExploreAreaId | null;
  subjectSlug?: string;
  topicSlug?: string;
};

/** Which left-pane chrome to show for Preloaded (browse vs reader). */
export function preloadedExplorerMode(opts: {
  workspaceMode: boolean;
  activeSubject?: string | null;
}): "home" | "collection" | "tree" {
  if (opts.workspaceMode && opts.activeSubject) return "collection";
  if (opts.workspaceMode) return "tree";
  return "home";
}

export function browseHref(path: PreloadedBrowsePath): string {
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
  return subject ? areaForGoal(subjectGoal(subject)) : null;
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
