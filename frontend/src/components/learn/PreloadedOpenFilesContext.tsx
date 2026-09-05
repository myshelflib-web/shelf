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
  reorderPreloadedTabs,
  tabFromLearnHref,
  updatePreloadedTabMeta,
  writePreloadedOpenFiles,
  type PreloadedOpenFilesState,
} from "@/lib/preloadedOpenFiles";
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
  reorderTabs: (
    fromKey: string,
    toKey: string,
    place: "before" | "after"
  ) => void;
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

  const expandFolderForTab = useCallback(
    (tab: OpenTab | null) => {
      if (!browse || !tab || !isCurriculumScope(tab.scope)) return;
      browse.setPath({
        subjectSlug: tab.scope.subjectSlug,
        topicSlug: tab.scope.topicSlug,
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
        queueMicrotask(() => expandFolderForTab(activePreloadedTab(next)));
        return next;
      });
    },
    [expandFolderForTab]
  );

  const activateTab = useCallback((key: string) => {
    setState((prev) => activatePreloadedTab(prev, key));
  }, []);

  const closeTab = useCallback(
    (key: string) => {
      setState((prev) => {
        const next = closePreloadedTab(prev, key);
        if (!next.tabs.length) {
          browse?.setPath({});
        }
        return next;
      });
    },
    [browse]
  );

  const reorderTabs = useCallback(
    (fromKey: string, toKey: string, place: "before" | "after") => {
      setState((prev) => reorderPreloadedTabs(prev, fromKey, toKey, place));
    },
    []
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
      reorderTabs,
      updateTabMeta,
    }),
    [
      state.tabs,
      activeTab,
      openFromHref,
      activateTab,
      closeTab,
      reorderTabs,
      updateTabMeta,
    ]
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
