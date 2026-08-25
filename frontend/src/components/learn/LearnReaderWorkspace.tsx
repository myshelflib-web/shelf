"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Group,
  Panel,
  Separator,
  usePanelRef,
} from "react-resizable-panels";
import {
  PanelLeft,
  PanelLeftClose,
  PanelRight,
  PanelRightClose,
  Sparkles,
  X,
} from "lucide-react";
import { Header } from "@/components/Header";
import { LibrarySidePanel } from "@/components/my-content/LibrarySidePanel";
import { ReaderBottomBar } from "@/components/ReaderBottomBar";
import { StudyPanel } from "@/components/StudyPanel";
import { SignInPromptModal } from "@/components/learn/SignInPromptModal";
import {
  DocumentPane,
  DocumentPaneHandlers,
  DocumentPaneSnapshot,
} from "@/components/my-content/reader/DocumentPane";
import { ReaderTabStrip } from "@/components/my-content/reader/ReaderTabStrip";
import { useReaderWorkspace } from "@/components/my-content/reader/useReaderWorkspace";
import {
  navHref,
  OpenTab,
  PersonalPageReaderScope,
  scopeHref,
  tabFromScope,
} from "@/components/my-content/reader/types";
import { useAuth } from "@/hooks/useAuth";
import { useCompactPortrait } from "@/hooks/useCompactPortrait";
import { useLearnStudyGoal } from "@/hooks/useLearnStudyGoal";
import { ShelfDrawer } from "@/components/ShelfDrawer";
import { api } from "@/lib/api";
import { isReaderHref, softReplace } from "@/lib/softNavigate";
import { getSelectedText, withShortcut } from "@/lib/hotkeys";
import { SubjectProgress } from "@/types";

const WARM_TABS_PER_PANE = 12;

export function LearnReaderWorkspace({
  scope: routeScope,
}: {
  scope: Extract<PersonalPageReaderScope, { kind: "learn" }>;
}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const compactPortrait = useCompactPortrait();
  const { setGuestGoal, showGoalPicker } = useLearnStudyGoal();

  const libraryPanelRef = usePanelRef();
  const studyAIPanelRef = usePanelRef();

  const [progressBySubject, setProgressBySubject] = useState<SubjectProgress[]>(
    []
  );
  const [signInFeature, setSignInFeature] = useState<string | null>(null);
  const [askSelection, setAskSelection] = useState<string | null>(null);
  const [askImage, setAskImage] = useState<string | undefined>();
  const [attachNote, setAttachNote] = useState<
    ((note: string) => Promise<void>) | undefined
  >();
  const [studyEmbed, setStudyEmbed] = useState(false);
  const [snapshots, setSnapshots] = useState<
    Record<string, DocumentPaneSnapshot>
  >({});
  const handlersRef = useRef<Record<string, DocumentPaneHandlers>>({});
  const [warmKeys, setWarmKeys] = useState<Record<string, string[]>>({});

  const workspace = useReaderWorkspace(routeScope);
  const {
    state,
    focusedPane,
    focusedTab,
    setLibraryCollapsed,
    setStudyAICollapsed,
    focusPane,
    activateTab,
    updateTabMeta,
    openInPane,
    closeTab,
  } = workspace;

  const returnTo = scopeHref(routeScope);
  const signInGate =
    !user && !authLoading
      ? {
          active: true,
          prompt: (feature: string) => setSignInFeature(feature),
        }
      : undefined;

  const promptSignIn = useCallback((feature = "Use Study AI") => {
    setSignInFeature(feature);
  }, []);

  const guestLocked = Boolean(signInGate?.active);

  const focusedSnap = focusedPane ? snapshots[focusedPane.id] : null;
  const focusedHandlers = focusedPane
    ? handlersRef.current[focusedPane.id]
    : null;
  const pageData = focusedSnap?.pageData ?? null;
  const isPdf = pageData?.contentType === "PDF";
  const studyPageId = pageData?.id ?? null;

  useEffect(() => {
    if (!user) {
      setProgressBySubject([]);
      return;
    }
    api.progress
      .summary()
      .then(({ progressBySubject: progress }) => setProgressBySubject(progress))
      .catch(() => {});
  }, [user]);

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
      if (panel.getSize().asPercentage < 8) panel.resize("22%");
    }
  }, [state.studyAICollapsed, studyAIPanelRef, compactPortrait]);

  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const layoutCompact = compactPortrait || isNarrow;

  useEffect(() => {
    if (!layoutCompact) return;
    libraryPanelRef.current?.collapse();
    studyAIPanelRef.current?.collapse();
  }, [layoutCompact, libraryPanelRef, studyAIPanelRef]);

  useEffect(() => {
    if (!focusedTab) return;
    const href = focusedTab.href;
    if (href !== scopeHref(routeScope)) {
      softReplace(href);
    }
  }, [focusedTab?.href, routeScope, focusedTab]);

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
      for (const id of Object.keys(next)) {
        if (!state.panes.some((p) => p.id === id)) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [state.panes]);

  const openStudyAIPanel = useCallback(() => {
    setStudyAICollapsed(false);
    if (compactPortrait) return;
    const panel = studyAIPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
      if (panel.getSize().asPercentage < 8) panel.resize("22%");
    }
  }, [setStudyAICollapsed, studyAIPanelRef, compactPortrait]);

  const closeStudyAIPanel = useCallback(() => {
    setStudyAICollapsed(true);
    studyAIPanelRef.current?.collapse();
    setAskSelection(null);
    setAskImage(undefined);
    setAttachNote(undefined);
  }, [setStudyAICollapsed, studyAIPanelRef]);

  const syncReaderUrl = useCallback(
    (href: string) => {
      if (href === scopeHref(routeScope)) return;
      if (isReaderHref(scopeHref(routeScope)) && isReaderHref(href)) {
        softReplace(href);
        return;
      }
      router.replace(href);
    },
    [routeScope, router]
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
        router.push("/learn");
        return;
      }
      if (nextFocusHref) syncReaderUrl(nextFocusHref);
    },
    [state.panes, closeTab, router, syncReaderUrl]
  );

  const handleOpenTab = useCallback(
    (paneId: string, tab: OpenTab) => {
      openInPane(paneId, tab, { activate: true });
      syncReaderUrl(tab.href);
    },
    [openInPane, syncReaderUrl]
  );

  const onAskStudyAI = useCallback(
    (
      _pageId: string,
      selection?: string,
      imageBase64?: string,
      onAttachNote?: (note: string) => Promise<void>,
      embedMode?: boolean
    ) => {
      if (selection) setAskSelection(selection);
      setAskImage(imageBase64);
      setAttachNote(() => onAttachNote);
      setStudyEmbed(Boolean(embedMode));
      openStudyAIPanel();
    },
    [openStudyAIPanel]
  );

  const askWithSelection = useCallback(() => {
    const text = getSelectedText();
    focusedHandlers?.openStudyAI(text || undefined);
    openStudyAIPanel();
  }, [focusedHandlers, openStudyAIPanel]);

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

  const panesToRender = focusedPane ? [focusedPane] : state.panes.slice(0, 1);

  const libraryExplorer = (
    <LibrarySidePanel
      currentHref={scopeHref(routeScope)}
      workspaceMode
      progressBySubject={progressBySubject}
      showGoalPicker={showGoalPicker}
      onStudyGoalChange={setGuestGoal}
      onGuestPersonalClick={() =>
        setSignInFeature("Your personal library")
      }
      returnTo={returnTo}
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
    <div className="h-full flex flex-col border-l border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2 shrink-0 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-light)] text-[var(--accent)] shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight">
              Study AI
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] truncate">
              {studyEmbed
                ? "Ask about this linked page"
                : askSelection
                  ? "Ask about the highlight"
                  : "Ask about this file"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {user && (
            <Link
              href="/study-ai"
              className="text-[11px] text-[var(--accent)] hover:underline px-1"
            >
              All chats
            </Link>
          )}
          <button
            type="button"
            onClick={closeStudyAIPanel}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
            title="Hide Study AI"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-4 py-3">
        {studyPageId ? (
          <StudyPanel
            articleId={studyPageId}
            selection={askSelection}
            imageBase64={askImage}
            onClearSelection={() => {
              setAskSelection(null);
              setAskImage(undefined);
              setAttachNote(undefined);
            }}
            onAttachNote={attachNote}
            embedMode={studyEmbed}
            guestLocked={guestLocked}
            onGuestLockedClick={promptSignIn}
          />
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            Open a page to ask Study AI about it.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Group orientation="horizontal" className="flex-1 min-h-0" id="learn-reader-shell">
          <Panel
            id="learn-library"
            panelRef={libraryPanelRef}
            defaultSize="18%"
            minSize="12%"
            maxSize="35%"
            collapsible
            collapsedSize={0}
            onResize={(size) => {
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

          <Panel id="learn-editor" minSize="30%" defaultSize="58%">
            <div className="h-full flex flex-col min-w-0 overflow-hidden bg-[var(--bg-primary)]">
              <div className="flex items-center gap-1 px-2 py-1 border-b border-[var(--border)] shrink-0 bg-[var(--bg-secondary)]">
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
                  className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] ml-auto"
                  title={
                    state.studyAICollapsed
                      ? withShortcut("Show Study AI panel", "mod+j")
                      : withShortcut("Hide Study AI panel", "mod+j")
                  }
                  aria-label={
                    state.studyAICollapsed ? "Show Study AI" : "Hide Study AI"
                  }
                  onClick={toggleStudyAI}
                >
                  {state.studyAICollapsed ? (
                    <PanelRight className="w-4 h-4" />
                  ) : (
                    <PanelRightClose className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="flex-1 flex min-h-0 overflow-hidden">
                {panesToRender.map((pane) => {
                  const active =
                    pane.tabs.find((t) => t.key === pane.activeTabKey) ??
                    pane.tabs[0];
                  if (!active) return null;
                  const focused = pane.id === state.focusedPaneId;

                  return (
                    <div
                      key={pane.id}
                      className="flex flex-col min-w-0 min-h-0 overflow-hidden flex-1"
                      onMouseDown={() => focusPane(pane.id)}
                    >
                      <ReaderTabStrip
                        paneId={pane.id}
                        tabs={pane.tabs}
                        activeTabKey={pane.activeTabKey}
                        focused={focused}
                        onActivate={(key) => handleActivateTab(pane.id, key)}
                        onClose={(key) => handleCloseTab(pane.id, key)}
                        onFocusPane={() => focusPane(pane.id)}
                        onDropPage={(tab) => handleOpenTab(pane.id, tab)}
                      />
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
                                notebook={null}
                                signInGate={signInGate}
                                onMeta={(patch) =>
                                  updateTabMeta(pane.id, tab.key, patch)
                                }
                                onNotebookPatch={() => {}}
                                onSnapshot={(snap) => {
                                  if (!isActive) return;
                                  setSnapshots((prev) => ({
                                    ...prev,
                                    [pane.id]: snap,
                                  }));
                                }}
                                onHandlers={(h) => {
                                  if (isActive) {
                                    handlersRef.current[pane.id] = h;
                                  }
                                }}
                                onAskStudyAI={onAskStudyAI}
                                workspaceStudyAIOpen={!state.studyAICollapsed}
                                onCloseStudyAI={closeStudyAIPanel}
                                onClipImage={() => {
                                  signInGate?.prompt("Save clips");
                                }}
                                onNavigate={(href) => router.push(href)}
                                onDropPage={(t) => handleOpenTab(pane.id, t)}
                                onReadPercent={() => {}}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {pageData && focusedHandlers && (
                <ReaderBottomBar
                  prev={
                    pageData.navigation.prev && focusedTab
                      ? {
                          href: navHref(
                            focusedTab.scope,
                            pageData.navigation.prev.slug
                          ),
                          title: pageData.navigation.prev.title,
                        }
                      : null
                  }
                  next={
                    pageData.navigation.next && focusedTab
                      ? {
                          href: navHref(
                            focusedTab.scope,
                            pageData.navigation.next.slug
                          ),
                          title: pageData.navigation.next.title,
                        }
                      : null
                  }
                  pdf={
                    isPdf && focusedSnap?.pdfPage && focusedSnap.pdfNumPages
                      ? {
                          page: focusedSnap.pdfPage,
                          numPages: focusedSnap.pdfNumPages,
                          onPrev: () => focusedHandlers.pdfPrevPage(),
                          onNext: () => focusedHandlers.pdfNextPage(),
                        }
                      : null
                  }
                  starred={pageData.starred}
                  completed={pageData.completed}
                  onToggleStar={() =>
                    void focusedHandlers.handleToggleStar()
                  }
                  onToggleComplete={() =>
                    void focusedHandlers.handleToggleComplete()
                  }
                  onOpenStudyAI={askWithSelection}
                  showStudyAI
                  guestLocked={guestLocked}
                  onGuestLockedClick={promptSignIn}
                />
              )}
            </div>
          </Panel>

          <Separator className="w-1 bg-[var(--border)] data-[separator]:hover:bg-[var(--accent)]/40" />

          <Panel
            id="learn-study-ai"
            panelRef={studyAIPanelRef}
            defaultSize={state.studyAICollapsed ? 0 : "22%"}
            minSize="16%"
            maxSize="40%"
            collapsible
            collapsedSize={0}
            onResize={(size) => {
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
      >
        {libraryExplorer}
      </ShelfDrawer>

      <ShelfDrawer
        open={layoutCompact && !state.studyAICollapsed}
        onClose={closeStudyAIPanel}
        side="right"
        wide
        title="Study AI"
      >
        {studyAIShell}
      </ShelfDrawer>

      {signInFeature && (
        <SignInPromptModal
          feature={signInFeature}
          returnTo={returnTo}
          onClose={() => setSignInFeature(null)}
        />
      )}
    </div>
  );
}
