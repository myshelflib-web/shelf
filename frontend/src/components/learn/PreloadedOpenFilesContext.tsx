"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { OpenTab } from "@/components/my-content/reader/types";
import { isCurriculumScope } from "@/lib/learnContent";
import {
  activatePreloadedTab,
  activePreloadedTab,
  closePreloadedTab,
  emptyPreloadedOpenFiles,
  openPreloadedTab,
  readPreloadedOpenFiles,
  tabFromLearnHref,
  updatePreloadedTabMeta,
  writePreloadedOpenFiles,
  type PreloadedOpenFilesState,
} from "@/lib/preloadedOpenFiles";
import { browsePathFromHref } from "@/lib/preloadedBrowse";
import {
  PreloadedBrowseProvider,
  useOptionalPreloadedBrowse,
} from "@/components/learn/PreloadedBrowseContext";
import type { PreloadedBrowsePath } from "@/lib/preloadedBrowse";

type PreloadedOpenFilesContextValue = {
  tabs: OpenTab[];
  activeTab: OpenTab | null;
  hasOpenFiles: boolean;
  openFromHref: (href: string, title?: string, pageId?: string) => void;
  activateTab: (key: string) => void;
  closeTab: (key: string) => void;
  updateTabMeta: (
    key: string,
    patch: Partial<Pick<OpenTab, "title" | "pageId">>
  ) => void;
};

const PreloadedOpenFilesContext =
  createContext<PreloadedOpenFilesContextValue | null>(null);

export function PreloadedOpenFilesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const browse = useOptionalPreloadedBrowse();
  const [state, setState] = useState<PreloadedOpenFilesState>(() =>
    readPreloadedOpenFiles()
  );

  useEffect(() => {
    writePreloadedOpenFiles(state);
  }, [state]);

  const syncBrowseToTab = useCallback(
    (tab: OpenTab | null) => {
      if (!browse) return;
      if (!tab || !isCurriculumScope(tab.scope)) {
        browse.setPath({
          areaId: browse.path.areaId,
          subjectSlug: browse.path.subjectSlug,
          topicSlug: browse.path.topicSlug,
        });
        return;
      }
      browse.setPath({
        subjectSlug: tab.scope.subjectSlug,
        topicSlug: tab.scope.topicSlug,
        articleSlug: tab.scope.articleSlug,
      });
    },
    [browse]
  );

  const openFromHref = useCallback(
    (href: string, title?: string, pageId?: string) => {
      const tab = tabFromLearnHref(href, title, pageId);
      if (!tab) return;
      setState((prev) => {
        const next = openPreloadedTab(prev, tab);
        const active = activePreloadedTab(next);
        queueMicrotask(() => syncBrowseToTab(active));
        return next;
      });
    },
    [syncBrowseToTab]
  );

  const activateTab = useCallback(
    (key: string) => {
      setState((prev) => {
        const next = activatePreloadedTab(prev, key);
        queueMicrotask(() => syncBrowseToTab(activePreloadedTab(next)));
        return next;
      });
    },
    [syncBrowseToTab]
  );

  const closeTab = useCallback(
    (key: string) => {
      setState((prev) => {
        const next = closePreloadedTab(prev, key);
        queueMicrotask(() => {
          if (!next.tabs.length) {
            const folder = browsePathFromHref(
              prev.tabs.find((t) => t.key === key)?.href ?? ""
            );
            browse?.setPath({
              areaId: browse.path.areaId ?? folder.areaId,
              subjectSlug: folder.subjectSlug ?? browse.path.subjectSlug,
              topicSlug: folder.topicSlug ?? browse.path.topicSlug,
            });
            return;
          }
          syncBrowseToTab(activePreloadedTab(next));
        });
        return next;
      });
    },
    [browse, syncBrowseToTab]
  );

  const updateTabMeta = useCallback(
    (key: string, patch: Partial<Pick<OpenTab, "title" | "pageId">>) => {
      setState((prev) => updatePreloadedTabMeta(prev, key, patch));
    },
    []
  );

  const activeTab = activePreloadedTab(state);
  const value = useMemo(
    () => ({
      tabs: state.tabs,
      activeTab,
      hasOpenFiles: state.tabs.length > 0,
      openFromHref,
      activateTab,
      closeTab,
      updateTabMeta,
    }),
    [state.tabs, activeTab, openFromHref, activateTab, closeTab, updateTabMeta]
  );

  return (
    <PreloadedOpenFilesContext.Provider value={value}>
      {children}
    </PreloadedOpenFilesContext.Provider>
  );
}

export function useOptionalPreloadedOpenFiles() {
  return useContext(PreloadedOpenFilesContext);
}

export function usePreloadedOpenFiles() {
  const ctx = useOptionalPreloadedOpenFiles();
  if (!ctx) {
    throw new Error("usePreloadedOpenFiles requires PreloadedOpenFilesProvider");
  }
  return ctx;
}

/** Browse folder path plus multi-file reader tabs. */
export function PreloadedBrowseShell({
  children,
  initialPath,
}: {
  children: React.ReactNode;
  initialPath?: PreloadedBrowsePath;
}) {
  return (
    <PreloadedBrowseProvider initialPath={initialPath}>
      <PreloadedOpenFilesProvider>{children}</PreloadedOpenFilesProvider>
    </PreloadedBrowseProvider>
  );
}
