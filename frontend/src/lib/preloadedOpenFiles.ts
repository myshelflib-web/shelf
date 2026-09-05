import {
  MAX_OPEN_TABS,
  OpenTab,
  tabFromScope,
} from "@/components/my-content/reader/types";
import { reorderOpenTabs } from "@/components/my-content/reader/reorderOpenTabs";
import { isCurriculumScope } from "@/lib/learnContent";
import { browsePathFromHref } from "@/lib/preloadedBrowse";
import { learnScope } from "@/lib/learnContent";

export const PRELOADED_OPEN_FILES_KEY = "shelf:preloaded-browse-tabs-v1";

export type PreloadedOpenFilesState = {
  tabs: OpenTab[];
  activeKey: string | null;
};

export function emptyPreloadedOpenFiles(): PreloadedOpenFilesState {
  return { tabs: [], activeKey: null };
}

export function tabFromLearnHref(
  href: string,
  title?: string,
  pageId?: string
): OpenTab | null {
  const path = browsePathFromHref(href);
  if (!path.subjectSlug || !path.topicSlug || !path.articleSlug) return null;
  return tabFromScope(
    learnScope(path.subjectSlug, path.topicSlug, path.articleSlug),
    title ?? path.articleSlug,
    pageId
  );
}

export function activePreloadedTab(
  state: PreloadedOpenFilesState
): OpenTab | null {
  if (!state.tabs.length) return null;
  return (
    state.tabs.find((t) => t.key === state.activeKey) ?? state.tabs[0] ?? null
  );
}

export function openPreloadedTab(
  state: PreloadedOpenFilesState,
  tab: OpenTab
): PreloadedOpenFilesState {
  const existing = state.tabs.find(
    (t) =>
      t.href === tab.href ||
      (tab.pageId != null && t.pageId === tab.pageId)
  );
  if (existing) {
    return {
      tabs: state.tabs.map((t) =>
        t.key === existing.key
          ? {
              ...t,
              title: tab.title || t.title,
              pageId: tab.pageId ?? t.pageId,
              scope: tab.scope,
            }
          : t
      ),
      activeKey: existing.key,
    };
  }
  const next = [...state.tabs, tab];
  const tabs =
    next.length > MAX_OPEN_TABS
      ? next.slice(next.length - MAX_OPEN_TABS)
      : next;
  return { tabs, activeKey: tab.key };
}

export function closePreloadedTab(
  state: PreloadedOpenFilesState,
  key: string
): PreloadedOpenFilesState {
  const idx = state.tabs.findIndex((t) => t.key === key);
  if (idx < 0) return state;
  const tabs = state.tabs.filter((t) => t.key !== key);
  if (!tabs.length) return emptyPreloadedOpenFiles();
  let activeKey = state.activeKey;
  if (activeKey === key) {
    activeKey = tabs[Math.min(idx, tabs.length - 1)]?.key ?? null;
  }
  return { tabs, activeKey };
}

export function activatePreloadedTab(
  state: PreloadedOpenFilesState,
  key: string
): PreloadedOpenFilesState {
  if (!state.tabs.some((t) => t.key === key)) return state;
  if (state.activeKey === key) return state;
  return { ...state, activeKey: key };
}

export function reorderPreloadedTabs(
  state: PreloadedOpenFilesState,
  fromKey: string,
  toKey: string,
  place: "before" | "after"
): PreloadedOpenFilesState {
  const tabs = reorderOpenTabs(state.tabs, fromKey, toKey, place);
  return tabs ? { ...state, tabs } : state;
}

export function updatePreloadedTabMeta(
  state: PreloadedOpenFilesState,
  key: string,
  patch: Partial<Pick<OpenTab, "title" | "pageId">>
): PreloadedOpenFilesState {
  let changed = false;
  const tabs = state.tabs.map((t) => {
    if (t.key !== key) return t;
    const next = { ...t };
    if (patch.title != null && patch.title !== t.title) {
      next.title = patch.title;
      changed = true;
    }
    if (patch.pageId != null && patch.pageId !== t.pageId) {
      next.pageId = patch.pageId;
      changed = true;
    }
    return next;
  });
  return changed ? { ...state, tabs } : state;
}

function sanitize(raw: unknown): PreloadedOpenFilesState {
  if (!raw || typeof raw !== "object") return emptyPreloadedOpenFiles();
  const rec = raw as Partial<PreloadedOpenFilesState>;
  if (!Array.isArray(rec.tabs)) return emptyPreloadedOpenFiles();
  const seen = new Set<string>();
  const tabs = rec.tabs.filter((t): t is OpenTab => {
    if (!t?.href || !t.scope || !isCurriculumScope(t.scope)) return false;
    if (seen.has(t.href)) return false;
    seen.add(t.href);
    return true;
  }).map((t) => ({ ...t, key: t.href }));
  if (!tabs.length) return emptyPreloadedOpenFiles();
  const activeKey = tabs.some((t) => t.key === rec.activeKey)
    ? rec.activeKey ?? tabs[0]!.key
    : tabs[0]!.key;
  return { tabs, activeKey };
}

export function readPreloadedOpenFiles(): PreloadedOpenFilesState {
  if (typeof window === "undefined") return emptyPreloadedOpenFiles();
  try {
    const raw = window.localStorage.getItem(PRELOADED_OPEN_FILES_KEY);
    if (!raw) return emptyPreloadedOpenFiles();
    return sanitize(JSON.parse(raw) as unknown);
  } catch {
    return emptyPreloadedOpenFiles();
  }
}

export function writePreloadedOpenFiles(state: PreloadedOpenFilesState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      PRELOADED_OPEN_FILES_KEY,
      JSON.stringify(state)
    );
  } catch {
    /* ignore quota */
  }
}
