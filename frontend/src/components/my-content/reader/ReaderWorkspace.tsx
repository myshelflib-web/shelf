"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Group,
  Panel,
  Separator,
  usePanelRef,
} from "react-resizable-panels";
import { Header } from "@/components/Header";
import { LibrarySidePanel } from "@/components/my-content/LibrarySidePanel";
import { ReaderBottomBar } from "@/components/ReaderBottomBar";
import { ScheduleReadModal } from "@/components/ScheduleReadModal";
import { ClipSaveModal } from "@/components/my-content/ClipSaveModal";
import { useAuth } from "@/hooks/useAuth";
import { useReadingTimer } from "@/hooks/useReadingTimer";
import { useScheduledPageHrefs } from "@/hooks/useScheduledPageHrefs";
import { api } from "@/lib/api";
import {
  getTopicGroups,
  insertPageInTree,
  insertTopicInTree,
  syncPageInTree,
} from "@/lib/myContentTree";
import { findCachedSubject } from "@/lib/offline/library";
import { UserSubject } from "@/types";
import { setLastRead } from "@/lib/tabViewState";
import {
  PanelLeftClose,
  PanelLeft,
  PanelRightClose,
  PanelRight,
  Columns2,
} from "lucide-react";
import { DocumentPane, DocumentPaneHandlers, DocumentPaneSnapshot, LoadedPage } from "./DocumentPane";
import { ReaderRightPanel } from "./ReaderRightPanel";
import { ReaderTabStrip } from "./ReaderTabStrip";
import { useReaderWorkspace } from "./useReaderWorkspace";
import { useHotkey } from "@/hooks/useHotkeys";
import { useCompactPortrait } from "@/hooks/useCompactPortrait";
import { useIsPhone } from "@/hooks/useIsPhone";
import { useReaderCompactInit } from "@/hooks/useReaderCompactInit";
import { ShelfDrawer } from "@/components/ShelfDrawer";
import { getSelectedText, withShortcut } from "@/lib/hotkeys";
import { emitFocusNotebook } from "@/lib/shelfEvents";
import {
  OpenTab,
  PersonalPageReaderScope,
  scopeHref,
  tabFromScope,
} from "./types";
import { isReaderHref, softReplace } from "@/lib/softNavigate";
import {
  SHELF_CONTENT_CHANGED,
  SHELF_OPEN_PAGE,
  contentChangeFromEvent,
  type OpenPageDetail,
} from "@/lib/contentEvents";

export type { PersonalPageReaderScope };

/** How many recently used tabs stay mounted (hidden) per pane — keeps PDF docs warm. */
const WARM_TABS_PER_PANE = 12;

export function ReaderWorkspace({
  scope: routeScope,
}: {
  scope: PersonalPageReaderScope;
}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const libraryPanelRef = usePanelRef();
  const studyAIPanelRef = usePanelRef();

  const [notebook, setNotebook] = useState<UserSubject | null>(null);
  const [askSelection, setAskSelection] = useState<string | null>(null);
  const [askImage, setAskImage] = useState<string | undefined>();
  const [attachNote, setAttachNote] = useState<
    ((note: string) => Promise<void>) | undefined
  >();
  const [studyEmbed, setStudyEmbed] = useState(false);
  const [clipImage, setClipImage] = useState<string | null>(null);
  const [clipPage, setClipPage] = useState<LoadedPage | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<
    Record<string, DocumentPaneSnapshot>
  >({});
  // Ref (not state): DocumentPane pushes a new handlers object every effect run.
  // Storing that in useState re-renders the workspace → new `scope` identity →
  // effect runs again → infinite loop and frozen navigation.
  const handlersRef = useRef<Record<string, DocumentPaneHandlers>>({});
  /** Recently active tab keys per pane — stay mounted while inactive. */
  const [warmKeys, setWarmKeys] = useState<Record<string, string[]>>({});

  const workspace = useReaderWorkspace(routeScope);
  const compactPortrait = useCompactPortrait();
  const isPhone = useIsPhone();
  const {
    state,
    focusedPane,
    focusedTab,
    setLibraryCollapsed,
    setStudyAICollapsed,
    focusPane,
    activateTab,
    reorderTabs,
    updateTabMeta,
    updateTabsByPageId,
    openInPane,
    closeTab,
    closeTabsForPageId,
    splitWith,
    unsplit,
  } = workspace;

  const pageSlug =
    routeScope.kind === "learn"
      ? routeScope.articleSlug
      : routeScope.kind === "shared"
        ? routeScope.pageId
        : routeScope.pageSlug;
  const notebookSlug =
    routeScope.kind === "root-file" ||
    routeScope.kind === "learn" ||
    routeScope.kind === "shared"
      ? null
      : routeScope.notebookSlug;
  const topicSlug =
    routeScope.kind === "topic"
      ? routeScope.topicSlug
      : routeScope.kind === "learn"
        ? routeScope.topicSlug
        : null;

  const scheduledHrefs = useScheduledPageHrefs(Boolean(user));
  const focusedSnap = focusedPane ? snapshots[focusedPane.id] : null;
  const focusedHandlers = focusedPane
    ? handlersRef.current[focusedPane.id]
    : null;

  const studyPageId = focusedSnap?.pageData?.id ?? null;

  useReadingTimer(
    Boolean(
      user &&
        focusedSnap?.pageData &&
        !focusedSnap.loading &&
        (!focusedSnap.editing || focusedSnap.liveEdit)
    )
  );

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    if (!notebookSlug) {
      setNotebook(null);
      return;
    }
    const slug = notebookSlug;
    setNotebook(findCachedSubject(slug));
    const load = () =>
      api.myContent
        .getSubject(slug)
        .then(({ subject }) => setNotebook(subject))
        .catch(() => setNotebook((prev) => (prev?.slug === slug ? prev : null)));
    load();
    const onChange = (e: Event) => {
      const change = contentChangeFromEvent(e);
      if (change?.type === "topic-created" && change.notebookSlug === slug) {
        setNotebook((prev) => {
          if (!prev) return prev;
          return (
            insertTopicInTree([prev], change.notebookId, change.topicGroup)[0] ??
            prev
          );
        });
      } else if (
        change?.type === "page-created" &&
        change.notebookSlug === slug
      ) {
        setNotebook((prev) => {
          if (!prev) return prev;
          return (
            insertPageInTree(
              [prev],
              change.page,
              change.notebookId,
              change.topicId
            )[0] ?? prev
          );
        });
      } else if (change?.type === "page-renamed") {
        setNotebook((prev) =>
          prev
            ? syncPageInTree([prev], change.pageId, { title: change.title })[0]
            : prev
        );
      } else {
        load();
      }
    };
    window.addEventListener(SHELF_CONTENT_CHANGED, onChange);
    return () => window.removeEventListener(SHELF_CONTENT_CHANGED, onChange);
  }, [user, notebookSlug]);

  useEffect(() => {
    const onRenamed = (e: Event) => {
      const change = contentChangeFromEvent(e);
      if (change?.type !== "page-renamed") return;
      updateTabsByPageId(change.pageId, change.title);
    };
    window.addEventListener(SHELF_CONTENT_CHANGED, onRenamed);
    return () => window.removeEventListener(SHELF_CONTENT_CHANGED, onRenamed);
  }, [updateTabsByPageId]);

  useEffect(() => {
    if (!focusedTab) return;
    const href = focusedTab.href;
    if (href !== scopeHref(routeScope)) {
      // Soft URL update — router.replace remounts the App Router page and reloads PDFs.
      softReplace(href);
    }
  }, [focusedTab?.href, routeScope, focusedTab]);

  useEffect(() => {
    // Only remember pages that actually loaded for this account (not 404 / leaked tabs).
    if (!focusedTab?.pageId) return;
    const notebook =
      focusedTab.scope.kind === "root-file" ||
      focusedTab.scope.kind === "learn" ||
      focusedTab.scope.kind === "shared"
        ? null
        : focusedTab.scope.notebookSlug;
    const topic =
      focusedTab.scope.kind === "topic" || focusedTab.scope.kind === "learn"
        ? focusedTab.scope.topicSlug
        : null;
    setLastRead({
      href: focusedTab.href,
      title: focusedTab.title,
      notebookSlug: notebook,
      topicSlug: topic,
    });
  }, [focusedTab?.href, focusedTab?.title, focusedTab?.pageId, focusedTab]);

  useEffect(() => {
    emitFocusNotebook(
      notebook
        ? { id: notebook.id, name: notebook.name }
        : { id: null, name: null }
    );
    return () => emitFocusNotebook({ id: null, name: null });
  }, [notebook]);

  // Keep active (+ previous) tabs warm so switching doesn't remount DocumentPane/PdfViewer.
  useEffect(() => {
    setWarmKeys((prev) => {
      let changed = false;
      const next: Record<string, string[]> = { ...prev };
      for (const pane of state.panes) {
        const active = pane.activeTabKey;
        if (!active) continue;
        const existing = next[pane.id] ?? [];
        const merged = [
          active,
          ...existing.filter((k) => k !== active && pane.tabs.some((t) => t.key === k)),
        ].slice(0, WARM_TABS_PER_PANE);
        if (
          merged.length !== existing.length ||
          merged.some((k, i) => k !== existing[i])
        ) {
          next[pane.id] = merged;
          changed = true;
        }
      }
      // Drop panes that no longer exist
      for (const id of Object.keys(next)) {
        if (!state.panes.some((p) => p.id === id)) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [state.panes]);

  // Stabilize: only depend on href string for route sync above

  useEffect(() => {
    const panel = libraryPanelRef.current;
    if (!panel) return;
    if (compactPortrait) {
      if (!panel.isCollapsed()) panel.collapse();
      return;
    }
    if (state.libraryCollapsed && !panel.isCollapsed()) panel.collapse();
    if (!state.libraryCollapsed && panel.isCollapsed()) panel.expand();
  }, [state.libraryCollapsed, libraryPanelRef, compactPortrait]);

  useEffect(() => {
    const panel = studyAIPanelRef.current;
    if (!panel) return;
    if (compactPortrait) {
      if (!panel.isCollapsed()) panel.collapse();
      return;
    }
    if (state.studyAICollapsed && !panel.isCollapsed()) panel.collapse();
    if (!state.studyAICollapsed) {
      if (panel.isCollapsed()) panel.expand();
      if (panel.getSize().asPercentage < 8) {
        panel.resize("22%");
      }
    }
  }, [state.studyAICollapsed, studyAIPanelRef, compactPortrait]);

  const openStudyAIPanel = useCallback(() => {
    setStudyAICollapsed(false);
    if (compactPortrait) return;
    const panel = studyAIPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
      if (panel.getSize().asPercentage < 8) {
        panel.resize("22%");
      }
    }
  }, [setStudyAICollapsed, studyAIPanelRef, compactPortrait]);

  const closeStudyAIPanel = useCallback(() => {
    setStudyAICollapsed(true);
    studyAIPanelRef.current?.collapse();
    setAskSelection(null);
    setAskImage(undefined);
    setAttachNote(undefined);
  }, [setStudyAICollapsed, studyAIPanelRef]);

  const syncReaderUrl = useCallback((href: string) => {
    if (href === scopeHref(routeScope)) return;
    // Already inside a reader route → soft update. Leaving/entering uses Next navigation.
    if (isReaderHref(scopeHref(routeScope)) && isReaderHref(href)) {
      softReplace(href);
      return;
    }
    router.replace(href);
  }, [routeScope, router]);

  useEffect(() => {
    const onDeleted = (e: Event) => {
      const change = contentChangeFromEvent(e);
      if (change?.type !== "page-deleted") return;
      const { nextFocusHref, emptied } = closeTabsForPageId(change.pageId);
      if (emptied) {
        router.push("/my-content");
        return;
      }
      if (nextFocusHref) syncReaderUrl(nextFocusHref);
    };
    window.addEventListener(SHELF_CONTENT_CHANGED, onDeleted);
    return () => window.removeEventListener(SHELF_CONTENT_CHANGED, onDeleted);
  }, [closeTabsForPageId, router, syncReaderUrl]);

  const onNavigate = useCallback(
    (href: string) => {
      router.push(href);
    },
    [router]
  );

  const handleActivateTab = useCallback(
    (paneId: string, tabKey: string) => {
      const pane = state.panes.find((p) => p.id === paneId);
      const tab = pane?.tabs.find((t) => t.key === tabKey);
      activateTab(paneId, tabKey);
      if (tab) syncReaderUrl(tab.href);
    },
    [activateTab, state.panes, syncReaderUrl]
  );

  const handleCloseTab = useCallback(
    (paneId: string, tabKey: string) => {
      const isLastOverall =
        state.panes.reduce((n, p) => n + p.tabs.length, 0) <= 1;
      const { nextFocusHref, emptied } = closeTab(paneId, tabKey);
      if (isLastOverall || emptied) {
        router.push("/my-content");
        return;
      }
      if (nextFocusHref) syncReaderUrl(nextFocusHref);
    },
    [state.panes, closeTab, router, syncReaderUrl]
  );

  const handleOpenTab = useCallback(
    (paneId: string, tab: OpenTab) => {
      openInPane(paneId, tab, { activate: true, replace: isPhone });
      syncReaderUrl(tab.href);
      if (isPhone) {
        setLibraryCollapsed(true);
      }
    },
    [openInPane, syncReaderUrl, isPhone, setLibraryCollapsed]
  );

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<OpenPageDetail>).detail;
      if (!detail?.href || !detail.scope) return;
      const paneId = focusedPane?.id ?? state.focusedPaneId;
      handleOpenTab(
        paneId,
        tabFromScope(detail.scope, detail.title, detail.pageId)
      );
    };
    window.addEventListener(SHELF_OPEN_PAGE, onOpen);
    return () => window.removeEventListener(SHELF_OPEN_PAGE, onOpen);
  }, [focusedPane?.id, state.focusedPaneId, handleOpenTab]);

  const handleSplit = useCallback(
    (tab: OpenTab) => {
      if (typeof window !== "undefined" && window.innerWidth < 768) return;
      splitWith(tab);
      softReplace(tab.href);
    },
    [splitWith]
  );

  const onAskStudyAI = useCallback(
    (
      pageId: string,
      selection?: string,
      imageBase64?: string,
      onAttachNote?: (note: string) => Promise<void>,
      embedMode?: boolean
    ) => {
      void pageId;
      if (selection) setAskSelection(selection);
      setAskImage(imageBase64);
      setAttachNote(() => onAttachNote);
      setStudyEmbed(Boolean(embedMode));
      openStudyAIPanel();
    },
    [openStudyAIPanel]
  );

  const onClipImage = useCallback((data: string, page: LoadedPage) => {
    setClipImage(data);
    setClipPage(page);
  }, []);

  const onReadPercent = useCallback((_pageId: string, _percent: number) => {
    /* persisted inside DocumentPane */
  }, []);

  const currentTopic =
    notebook && topicSlug
      ? getTopicGroups(notebook).find((g) => g.slug === topicSlug)
      : undefined;

  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const layoutCompact = compactPortrait || isNarrow;

  useReaderCompactInit(layoutCompact, setLibraryCollapsed, setStudyAICollapsed);

  useEffect(() => {
    if (!layoutCompact) return;
    libraryPanelRef.current?.collapse();
    studyAIPanelRef.current?.collapse();
  }, [layoutCompact, libraryPanelRef, studyAIPanelRef]);

  const isSplit = state.panes.length > 1;
  const canSplit =
    !layoutCompact &&
    state.panes.length < 2 &&
    state.panes.reduce((n, p) => n + p.tabs.length, 0) > 1;
  const panesToRender =
    isSplit && !layoutCompact
      ? state.panes
      : focusedPane
        ? [focusedPane]
        : state.panes.slice(0, 1);

  const editing = focusedSnap?.editing ?? false;
  const liveEdit = focusedSnap?.liveEdit ?? false;
  const modalEditing = editing && !liveEdit;
  const readerReady = Boolean(user && !authLoading && focusedPane);
  const isPdf = focusedSnap?.pageData?.contentType === "PDF";
  const isPreloaded = focusedSnap?.pageData?.isPreloaded ?? false;

  const toggleLibrary = useCallback(() => {
    const next = !state.libraryCollapsed;
    setLibraryCollapsed(next);
    if (compactPortrait) return;
    const panel = libraryPanelRef.current;
    if (next) panel?.collapse();
    else panel?.expand();
  }, [state.libraryCollapsed, setLibraryCollapsed, libraryPanelRef, compactPortrait]);

  const toggleStudyAI = useCallback(() => {
    if (state.studyAICollapsed) openStudyAIPanel();
    else closeStudyAIPanel();
  }, [state.studyAICollapsed, openStudyAIPanel, closeStudyAIPanel]);

  const cycleTab = useCallback(
    (dir: 1 | -1) => {
      if (!focusedPane) return;
      const tabs = focusedPane.tabs;
      if (tabs.length < 2) return;
      const i = tabs.findIndex((t) => t.key === focusedPane.activeTabKey);
      const idx = i < 0 ? 0 : i;
      const next = tabs[(idx + dir + tabs.length) % tabs.length];
      if (next) handleActivateTab(focusedPane.id, next.key);
    },
    [focusedPane, handleActivateTab]
  );

  const closeFocusedTab = useCallback(() => {
    if (!focusedPane?.activeTabKey) return;
    handleCloseTab(focusedPane.id, focusedPane.activeTabKey);
  }, [focusedPane, handleCloseTab]);

  const splitFocused = useCallback(() => {
    if (!canSplit || !focusedTab) return;
    handleSplit(focusedTab);
  }, [canSplit, focusedTab, handleSplit]);

  const unsplitFocused = useCallback(() => {
    if (focusedPane) unsplit(focusedPane.id);
  }, [focusedPane, unsplit]);

  const askWithSelection = useCallback(() => {
    const text = getSelectedText();
    focusedHandlers?.openStudyAI(text || undefined);
    openStudyAIPanel();
  }, [focusedHandlers, openStudyAIPanel]);

  useHotkey("[", toggleLibrary, { enabled: readerReady && !modalEditing });
  useHotkey("mod+b", toggleLibrary, { enabled: readerReady && !modalEditing });
  useHotkey("]", toggleStudyAI, { enabled: readerReady && !modalEditing });
  useHotkey("mod+j", toggleStudyAI, { enabled: readerReady && !modalEditing });
  useHotkey("mod+l", askWithSelection, {
    allowInInput: true,
    enabled: readerReady,
  });
  useHotkey("mod+\\", () => {
    if (isSplit) unsplitFocused();
    else splitFocused();
  }, { enabled: readerReady && !modalEditing });
  useHotkey("|", () => {
    if (isSplit) unsplitFocused();
    else splitFocused();
  }, { enabled: readerReady && !modalEditing });
  useHotkey("{", () => cycleTab(-1), { enabled: readerReady && !modalEditing });
  useHotkey("}", () => cycleTab(1), { enabled: readerReady && !modalEditing });
  useHotkey("w", closeFocusedTab, { enabled: readerReady && !modalEditing });
  useHotkey("e", () => focusedHandlers?.startEditing(), {
    enabled: readerReady && !modalEditing && !isPdf && !liveEdit && !isPreloaded,
  });
  useHotkey("mod+s", () => {
    if (focusedSnap?.pageData?.contentType === "HTML") {
      void focusedHandlers?.flushEditing();
      return;
    }
    void focusedHandlers?.saveEditing();
  }, {
    allowInInput: true,
    enabled: readerReady && editing,
  });
  useHotkey("escape", () => focusedHandlers?.cancelEditing(), {
    allowInInput: true,
    enabled: readerReady && modalEditing,
  });
  useHotkey("s", () => setScheduleOpen(true), {
    enabled: readerReady && !modalEditing,
  });
  useHotkey("*", () => void focusedHandlers?.handleToggleStar(), {
    enabled: readerReady && !modalEditing && !isPreloaded,
  });
  useHotkey("x", () => void focusedHandlers?.handleToggleComplete(), {
    enabled: readerReady && !modalEditing,
  });
  useHotkey("f", () => focusedHandlers?.toggleFullscreen(), {
    enabled: readerReady,
    allowWhenSuppressed: true,
  });
  useHotkey("left", () => focusedHandlers?.pdfPrevPage(), {
    enabled: readerReady && !modalEditing && isPdf,
  });
  useHotkey("right", () => focusedHandlers?.pdfNextPage(), {
    enabled: readerReady && !modalEditing && isPdf,
  });
  useHotkey("pageup", () => focusedHandlers?.pdfPrevPage(), {
    enabled: readerReady && !modalEditing && isPdf,
  });
  useHotkey("pagedown", () => focusedHandlers?.pdfNextPage(), {
    enabled: readerReady && !modalEditing && isPdf,
  });
  useHotkey("j", () => focusedHandlers?.pdfNextPage(), {
    enabled: readerReady && !modalEditing && isPdf,
  });
  useHotkey("k", () => focusedHandlers?.pdfPrevPage(), {
    enabled: readerReady && !modalEditing && isPdf,
  });
  useHotkey("-", () => focusedHandlers?.pdfZoomOut(), {
    enabled: readerReady && !modalEditing,
    allowWhenSuppressed: true,
  });
  useHotkey("=", () => focusedHandlers?.pdfZoomIn(), {
    enabled: readerReady && !modalEditing,
    allowWhenSuppressed: true,
  });
  useHotkey("+", () => focusedHandlers?.pdfZoomIn(), {
    enabled: readerReady && !modalEditing,
    allowWhenSuppressed: true,
  });
  useHotkey("m", () => focusedHandlers?.pdfToggleNight(), {
    enabled: readerReady && !modalEditing && isPdf,
  });

  if (authLoading || !user) return null;

  const pageData = focusedSnap?.pageData ?? null;
  const currentHref = focusedSnap?.currentHref ?? scopeHref(routeScope);

  const libraryExplorer = (
    <LibrarySidePanel
      notebook={notebook ?? undefined}
      notebookSlug={notebookSlug ?? undefined}
      currentTopicSlug={topicSlug ?? undefined}
      currentPageSlug={pageSlug}
      currentHref={scopeHref(routeScope)}
      enablePageDrag
      workspaceMode
      onOpenPage={(payload) => {
        const paneId = focusedPane?.id ?? state.focusedPaneId;
        handleOpenTab(
          paneId,
          tabFromScope(payload.scope, payload.title, payload.pageId),
        );
        if (layoutCompact) setLibraryCollapsed(true);
      }}
      className="w-full border-r-0"
    />
  );

  const studyAIShell = (
    <ReaderRightPanel
      onClose={closeStudyAIPanel}
      studyPageId={studyPageId}
      studyEmbed={studyEmbed}
      askSelection={askSelection}
      askImage={askImage}
      attachNote={attachNote}
      onClearSelection={() => {
        setAskSelection(null);
        setAskImage(undefined);
        setAttachNote(undefined);
      }}
      capturePdfPage={() => focusedHandlers?.capturePdfPage() ?? ""}
    />
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Group
          orientation="horizontal"
          className={`flex-1 min-h-0 ${layoutCompact ? "reader-shell-compact" : ""}`}
          id="reader-shell"
        >
          <Panel
            id="library"
            panelRef={libraryPanelRef}
            defaultSize="18%"
            minSize="12%"
            maxSize="35%"
            collapsible
            collapsedSize={0}
            onResize={(size) => {
              if (layoutCompact) return;
              if (size.asPercentage < 1 && !state.libraryCollapsed) {
                setLibraryCollapsed(true);
              } else if (size.asPercentage >= 1 && state.libraryCollapsed) {
                setLibraryCollapsed(false);
              }
            }}
          >
            {!layoutCompact ? (
              <div className="h-full overflow-hidden">{libraryExplorer}</div>
            ) : null}
          </Panel>

          <Separator className="w-1 bg-[var(--border)] data-[separator]:hover:bg-[var(--accent)]/40" />

          <Panel id="editor" minSize="30%" defaultSize="82%">
            <div className="relative h-full flex flex-col min-w-0 overflow-hidden bg-[var(--bg-primary)]">
              <div className="reader-workspace-toolbar flex items-center gap-1 px-2 py-1 border-b border-[var(--border)] shrink-0 bg-[var(--bg-secondary)] min-w-0">
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                    title={
                      state.libraryCollapsed
                        ? withShortcut("Show library sidebar", "mod+b")
                        : withShortcut("Hide library sidebar", "mod+b")
                    }
                    aria-label={
                      state.libraryCollapsed ? "Show library" : "Hide library"
                    }
                    onClick={toggleLibrary}
                  >
                    {state.libraryCollapsed ? (
                      <PanelLeft className="w-4 h-4" />
                    ) : (
                      <PanelLeftClose className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    className={`p-1.5 rounded-md hover:bg-[var(--bg-elevated)] ${
                      isSplit || canSplit
                        ? "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        : "text-[var(--text-muted)]/40 cursor-not-allowed"
                    } ${isSplit ? "bg-[var(--accent-light)] text-[var(--accent)]" : ""}`}
                    title={
                      isSplit
                        ? withShortcut("Unsplit editor", "mod+\\")
                        : canSplit
                          ? withShortcut(
                              "Split editor — open the active tab beside another",
                              "mod+\\"
                            )
                          : "Open another page first to split the editor"
                    }
                    aria-label={isSplit ? "Unsplit editor" : "Split editor"}
                    disabled={!isSplit && !canSplit}
                    onClick={() => {
                      if (isSplit) {
                        unsplitFocused();
                        return;
                      }
                      if (!canSplit || !focusedTab) return;
                      handleSplit(focusedTab);
                    }}
                  >
                    <Columns2 className="w-4 h-4" />
                  </button>

                  {isSplit && (
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                      title={withShortcut(
                        "Merge split panes back into one",
                        "mod+\\"
                      )}
                      onClick={() => focusedPane && unsplit(focusedPane.id)}
                    >
                      Unsplit
                    </button>
                  )}
                </div>

                {panesToRender.length === 1 && panesToRender[0] ? (
                  isPhone ? (
                    <div className="flex-1 min-w-0 px-2 flex items-center">
                      <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                        {panesToRender[0].tabs.find(
                          (t) => t.key === panesToRender[0].activeTabKey
                        )?.title ?? "Document"}
                      </span>
                    </div>
                  ) : (
                    <div className="reader-workspace-tabs flex-1 min-w-0">
                      <ReaderTabStrip
                        variant="toolbar"
                        paneId={panesToRender[0].id}
                        tabs={panesToRender[0].tabs}
                        activeTabKey={panesToRender[0].activeTabKey}
                        focused
                        onActivate={(key) =>
                          handleActivateTab(panesToRender[0].id, key)
                        }
                        onClose={(key) =>
                          handleCloseTab(panesToRender[0].id, key)
                        }
                        onFocusPane={() => focusPane(panesToRender[0].id)}
                        onDropPage={(tab) =>
                          handleOpenTab(panesToRender[0].id, tab)
                        }
                        onReorderTabs={(fromKey, toKey, place) =>
                          reorderTabs(panesToRender[0].id, fromKey, toKey, place)
                        }
                      />
                    </div>
                  )
                ) : (
                  <div className="flex-1 min-w-0" />
                )}

                <div className="flex items-center gap-1 shrink-0 pl-1">
                  <button
                    type="button"
                    className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                    title={
                      state.studyAICollapsed
                        ? withShortcut("Show Study AI panel", "mod+j")
                        : withShortcut("Hide Study AI panel", "mod+j")
                    }
                    aria-label={
                      state.studyAICollapsed ? "Show Study AI" : "Hide Study AI"
                    }
                    onClick={() => {
                      if (state.studyAICollapsed) openStudyAIPanel();
                      else closeStudyAIPanel();
                    }}
                  >
                    {state.studyAICollapsed ? (
                      <PanelRight className="w-4 h-4" />
                    ) : (
                      <PanelRightClose className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex-1 flex min-h-0 overflow-hidden">
                <div className="flex-1 flex min-h-0 overflow-hidden min-w-0">
                {panesToRender.map((pane, idx) => {
                  const active =
                    pane.tabs.find((t) => t.key === pane.activeTabKey) ??
                    pane.tabs[0];
                  if (!active) return null;
                  const focused = pane.id === state.focusedPaneId;
                  return (
                    <div
                      key={pane.id}
                      className={`flex flex-col min-w-0 min-h-0 overflow-hidden ${
                        panesToRender.length > 1 ? "flex-1" : "flex-1"
                      } ${idx > 0 ? "border-l border-[var(--border)]" : ""}`}
                      onMouseDown={() => focusPane(pane.id)}
                    >
                      {panesToRender.length > 1 && (
                        <ReaderTabStrip
                          paneId={pane.id}
                          tabs={pane.tabs}
                          activeTabKey={pane.activeTabKey}
                          focused={focused}
                          onActivate={(key) => handleActivateTab(pane.id, key)}
                          onClose={(key) => handleCloseTab(pane.id, key)}
                          onFocusPane={() => focusPane(pane.id)}
                          onDropPage={(tab) => handleOpenTab(pane.id, tab)}
                          onReorderTabs={(fromKey, toKey, place) =>
                            reorderTabs(pane.id, fromKey, toKey, place)
                          }
                        />
                      )}
                      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                        {pane.tabs.map((tab) => {
                          const isActive = tab.key === active.key;
                          const warm = (warmKeys[pane.id] ?? []).includes(
                            tab.key
                          );
                          if (!isActive && !warm) return null;
                          return (
                            <div
                              key={tab.key}
                              className={
                                isActive
                                  ? "flex-1 flex flex-col min-h-0 overflow-hidden"
                                  : "hidden"
                              }
                              aria-hidden={!isActive}
                            >
                              <DocumentPane
                                tab={tab}
                                paneId={pane.id}
                                focused={focused && isActive}
                                notebook={notebook}
                                onMeta={(patch) =>
                                  updateTabMeta(pane.id, tab.key, patch)
                                }
                                onNotebookPatch={setNotebook}
                                onSnapshot={(snap) => {
                                  if (!isActive) return;
                                  setSnapshots((prev) => {
                                    const old = prev[pane.id];
                                    if (
                                      old &&
                                      old.tabKey === snap.tabKey &&
                                      old.loading === snap.loading &&
                                      old.editing === snap.editing &&
                                      old.liveEdit === snap.liveEdit &&
                                      old.saving === snap.saving &&
                                      old.htmlClip === snap.htmlClip &&
                                      old.pageData?.id === snap.pageData?.id &&
                                      old.pageData?.title ===
                                        snap.pageData?.title &&
                                      old.pageData?.completed ===
                                        snap.pageData?.completed &&
                                      old.pageData?.starred ===
                                        snap.pageData?.starred &&
                                      old.pageData?.content ===
                                        snap.pageData?.content &&
                                      old.scrollContainer ===
                                        snap.scrollContainer &&
                                      old.contentRoot === snap.contentRoot &&
                                      old.pdfPage === snap.pdfPage &&
                                      old.pdfNumPages === snap.pdfNumPages &&
                                      old.highlights === snap.highlights &&
                                      old.highlightsHydrating ===
                                        snap.highlightsHydrating
                                    ) {
                                      return prev;
                                    }
                                    return { ...prev, [pane.id]: snap };
                                  });
                                }}
                                onHandlers={(h) => {
                                  if (isActive) {
                                    handlersRef.current[pane.id] = h;
                                  }
                                }}
                                onAskStudyAI={onAskStudyAI}
                                workspaceStudyAIOpen={!state.studyAICollapsed}
                                onCloseStudyAI={closeStudyAIPanel}
                                onClipImage={onClipImage}
                                onNavigate={onNavigate}
                                onPageDeleted={() => handleCloseTab(pane.id, tab.key)}
                                onDropPage={(t) => handleOpenTab(pane.id, t)}
                                onReadPercent={onReadPercent}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>

              {pageData && focusedHandlers && (
                <ReaderBottomBar
                  completed={pageData.completed}
                  onToggleComplete={focusedHandlers.handleToggleComplete}
                  onOpenStudyAI={() => {
                    openStudyAIPanel();
                    askWithSelection();
                  }}
                  onScheduleRead={() => setScheduleOpen(true)}
                  scheduled={scheduledHrefs.has(currentHref)}
                  editing={modalEditing}
                  saving={focusedSnap?.saving ?? false}
                  autosave={
                    pageData.contentType === "HTML" && !liveEdit
                  }
                  onEdit={
                    isPdf || liveEdit || isPreloaded
                      ? undefined
                      : focusedHandlers.startEditing
                  }
                  onSave={focusedHandlers.saveEditing}
                  onCancelEdit={focusedHandlers.cancelEditing}
                  showStudyAI
                />
              )}
            </div>
          </Panel>

          <Separator className="w-1 bg-[var(--border)] data-[separator]:hover:bg-[var(--accent)]/40" />

          <Panel
            id="study-ai"
            panelRef={studyAIPanelRef}
            defaultSize={state.studyAICollapsed ? 0 : "22%"}
            minSize="16%"
            maxSize="40%"
            collapsible
            collapsedSize={0}
            onResize={(size) => {
              if (layoutCompact) return;
              if (size.asPercentage < 1 && !state.studyAICollapsed) {
                setStudyAICollapsed(true);
              } else if (size.asPercentage >= 1 && state.studyAICollapsed) {
                setStudyAICollapsed(false);
              }
            }}
          >
            {!layoutCompact ? studyAIShell : null}
          </Panel>
        </Group>
      </div>

      <ShelfDrawer
        open={layoutCompact && !state.libraryCollapsed}
        onClose={() => setLibraryCollapsed(true)}
        title="Explorer"
        fullScreen={isPhone}
      >
        {libraryExplorer}
      </ShelfDrawer>

      <ShelfDrawer
        open={layoutCompact && !state.studyAICollapsed}
        onClose={closeStudyAIPanel}
        side="right"
        wide
        title="Study AI"
        fullScreen={isPhone}
      >
        {studyAIShell}
      </ShelfDrawer>

      {scheduleOpen && pageData && (
        <ScheduleReadModal
          pageTitle={pageData.title}
          pageHref={currentHref}
          onClose={() => setScheduleOpen(false)}
        />
      )}

      {clipImage && clipPage && (
        <ClipSaveModal
          imageDataUrl={clipImage}
          notebook={notebook}
          topic={currentTopic}
          currentPageId={clipPage.id}
          currentContent={clipPage.content}
          canAppend={
            clipPage.contentType !== "PDF" && clipPage.contentType !== "LINK"
          }
          onClose={() => {
            setClipImage(null);
            setClipPage(null);
          }}
          onSaved={(href) => {
            setClipImage(null);
            setClipPage(null);
            if (href) router.push(href);
            else focusedHandlers?.reloadPage();
          }}
        />
      )}
    </div>
  );
}
