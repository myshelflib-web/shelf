"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MAX_OPEN_TABS,
  OpenTab,
  ReaderPane,
  ReaderWorkspaceState,
  emptyPanesWorkspace,
  emptyWorkspace,
  newPaneId,
  readOwnedWorkspace,
  scopeHref,
  tabFromScope,
  writeOwnedWorkspace,
  PersonalPageReaderScope,
} from "./types";
import { AnalyticsEvents, track } from "@/lib/analytics";
import { reorderOpenTabs } from "./reorderOpenTabs";

function totalTabs(panes: ReaderPane[]): number {
  return panes.reduce((n, p) => n + p.tabs.length, 0);
}

function findTab(
  panes: ReaderPane[],
  match: (t: OpenTab) => boolean
): { pane: ReaderPane; tab: OpenTab } | null {
  for (const pane of panes) {
    const tab = pane.tabs.find(match);
    if (tab) return { pane, tab };
  }
  return null;
}

function loadStored(): Partial<ReaderWorkspaceState> | null {
  return readOwnedWorkspace();
}

function persist(state: ReaderWorkspaceState) {
  writeOwnedWorkspace(state);
}

function sanitize(
  stored: Partial<ReaderWorkspaceState> | null,
  routeScope: PersonalPageReaderScope
): ReaderWorkspaceState {
  const fallback = emptyWorkspace(routeScope);
  if (!stored?.panes?.length) return fallback;

  const seenHrefs = new Set<string>();
  const panes = stored.panes
    .filter((p) => p && Array.isArray(p.tabs))
    .map((p) => {
      const tabs = p.tabs
        .filter((t) => t?.href && t?.scope)
        .map((t) => ({
          ...t,
          key: t.href, // normalize — never remount on pageId
        }))
        .filter((t) => {
          if (seenHrefs.has(t.href)) return false;
          seenHrefs.add(t.href);
          return true;
        });
      let activeTabKey = p.activeTabKey;
      if (activeTabKey && !tabs.some((t) => t.key === activeTabKey)) {
        activeTabKey = tabs[0]?.key ?? null;
      }
      return {
        id: p.id || newPaneId(),
        tabs,
        activeTabKey: activeTabKey ?? tabs[0]?.key ?? null,
      };
    })
    .filter((p) => p.tabs.length > 0)
    .slice(0, 2);

  if (!panes.length) return fallback;

  const focusedPaneId =
    panes.find((p) => p.id === stored.focusedPaneId)?.id ?? panes[0]!.id;

  // One-time: open Study AI by default (older workspaces stored collapsed).
  const preferOpenKey = "shelf:study-ai-open-default-v1";
  let studyAICollapsed: boolean;
  try {
    if (!localStorage.getItem(preferOpenKey)) {
      localStorage.setItem(preferOpenKey, "1");
      studyAICollapsed = false;
    } else if (stored.studyAICollapsed !== undefined) {
      studyAICollapsed = Boolean(stored.studyAICollapsed);
    } else {
      studyAICollapsed = false;
    }
  } catch {
    studyAICollapsed =
      stored.studyAICollapsed !== undefined
        ? Boolean(stored.studyAICollapsed)
        : false;
  }

  return {
    panes,
    focusedPaneId,
    libraryCollapsed: Boolean(stored.libraryCollapsed),
    studyAICollapsed,
    spotifyCollapsed:
      stored.spotifyCollapsed !== undefined
        ? Boolean(stored.spotifyCollapsed)
        : true,
    telegramCollapsed:
      stored.telegramCollapsed !== undefined
        ? Boolean(stored.telegramCollapsed)
        : true,
  };
}

function trimOldest(panes: ReaderPane[], keepKey: string): ReaderPane[] {
  if (totalTabs(panes) <= MAX_OPEN_TABS) return panes;
  const flat: { paneId: string; key: string }[] = [];
  for (const pane of panes) {
    for (const tab of pane.tabs) {
      if (tab.key !== keepKey) flat.push({ paneId: pane.id, key: tab.key });
    }
  }
  const toRemove = flat.slice(0, totalTabs(panes) - MAX_OPEN_TABS);
  return panes
    .map((pane) => {
      const keys = new Set(
        toRemove.filter((r) => r.paneId === pane.id).map((r) => r.key)
      );
      if (!keys.size) return pane;
      const tabs = pane.tabs.filter((t) => !keys.has(t.key));
      let activeTabKey = pane.activeTabKey;
      if (activeTabKey && keys.has(activeTabKey)) {
        activeTabKey = tabs[tabs.length - 1]?.key ?? null;
      }
      return { ...pane, tabs, activeTabKey };
    })
    .filter((p) => p.tabs.length > 0);
}

export function useReaderWorkspace(routeScope: PersonalPageReaderScope) {
  const routeHref = scopeHref(routeScope);
  const [state, setState] = useState<ReaderWorkspaceState>(() =>
    sanitize(loadStored(), routeScope)
  );
  const hydrated = useRef(false);

  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      setState(sanitize(loadStored(), routeScope));
    }
  }, [routeScope]);

  useEffect(() => {
    persist(state);
  }, [state]);

  /** Ensure the current route page is open and focused. */
  const syncRoute = useCallback((scope: PersonalPageReaderScope, title?: string) => {
    const href = scopeHref(scope);
    setState((prev) => {
      const existing = findTab(prev.panes, (t) => t.href === href);
      if (existing) {
        const alreadyFocused =
          prev.focusedPaneId === existing.pane.id &&
          existing.pane.activeTabKey === existing.tab.key;
        const titleSame =
          title == null || existing.tab.title === title;
        if (alreadyFocused && titleSame) return prev;

        return {
          ...prev,
          focusedPaneId: existing.pane.id,
          panes: prev.panes.map((p) =>
            p.id === existing.pane.id
              ? {
                  ...p,
                  activeTabKey: existing.tab.key,
                  tabs: p.tabs.map((t) =>
                    t.key === existing.tab.key
                      ? {
                          ...t,
                          title: title ?? t.title,
                          scope,
                        }
                      : t
                  ),
                }
              : p
          ),
        };
      }

      const tab = tabFromScope(scope, title ?? "Untitled");
      const focused =
        prev.panes.find((p) => p.id === prev.focusedPaneId) ?? prev.panes[0];
      if (!focused) return emptyWorkspace(scope);

      let panes = prev.panes.map((p) => {
        if (p.id !== focused.id) return p;
        return {
          ...p,
          tabs: [...p.tabs, tab],
          activeTabKey: tab.key,
        };
      });
      panes = trimOldest(panes, tab.key);
      return { ...prev, panes, focusedPaneId: focused.id };
    });
  }, []);

  useEffect(() => {
    syncRoute(routeScope);
    // Sync when the route href changes, not when the scope object identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- routeHref is the stable key
  }, [routeHref, syncRoute]);

  const setLibraryCollapsed = useCallback((collapsed: boolean) => {
    setState((prev) => ({ ...prev, libraryCollapsed: collapsed }));
  }, []);

  const setStudyAICollapsed = useCallback((collapsed: boolean) => {
    setState((prev) => ({ ...prev, studyAICollapsed: collapsed }));
  }, []);

  const setSpotifyCollapsed = useCallback((collapsed: boolean) => {
    setState((prev) => ({
      ...prev,
      spotifyCollapsed: collapsed,
      ...(collapsed === false ? { telegramCollapsed: true } : {}),
    }));
  }, []);

  const setTelegramCollapsed = useCallback((collapsed: boolean) => {
    setState((prev) => ({
      ...prev,
      telegramCollapsed: collapsed,
      ...(collapsed === false ? { spotifyCollapsed: true } : {}),
    }));
  }, []);

  const focusPane = useCallback((paneId: string) => {
    setState((prev) =>
      prev.panes.some((p) => p.id === paneId)
        ? { ...prev, focusedPaneId: paneId }
        : prev
    );
  }, []);

  const activateTab = useCallback((paneId: string, tabKey: string) => {
    setState((prev) => ({
      ...prev,
      focusedPaneId: paneId,
      panes: prev.panes.map((p) =>
        p.id === paneId && p.tabs.some((t) => t.key === tabKey)
          ? { ...p, activeTabKey: tabKey }
          : p
      ),
    }));
  }, []);

  const reorderTabs = useCallback(
    (
      paneId: string,
      fromKey: string,
      toKey: string,
      place: "before" | "after"
    ) => {
      setState((prev) => {
        const panes = prev.panes.map((p) => {
          if (p.id !== paneId) return p;
          const tabs = reorderOpenTabs(p.tabs, fromKey, toKey, place);
          return tabs ? { ...p, tabs } : p;
        });
        return { ...prev, panes };
      });
    },
    []
  );

  const updateTabMeta = useCallback(
    (
      paneId: string,
      tabKey: string,
      patch: Partial<Pick<OpenTab, "title" | "pageId">>
    ) => {
      setState((prev) => {
        let changed = false;
        const panes = prev.panes.map((p) => {
          if (p.id !== paneId) return p;
          const tabs = p.tabs.map((t) => {
            if (t.key !== tabKey) return t;
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
          return changed ? { ...p, tabs } : p;
        });
        return changed ? { ...prev, panes } : prev;
      });
    },
    []
  );

  const updateTabsByPageId = useCallback((pageId: string, title: string) => {
    setState((prev) => {
      let changed = false;
      const panes = prev.panes.map((p) => ({
        ...p,
        tabs: p.tabs.map((t) => {
          if (t.pageId !== pageId || t.title === title) return t;
          changed = true;
          return { ...t, title };
        }),
      }));
      return changed ? { ...prev, panes } : prev;
    });
  }, []);

  const openInPane = useCallback(
    (paneId: string, tab: OpenTab, opts?: { activate?: boolean; replace?: boolean }) => {
      const activate = opts?.activate !== false;
      const replace = opts?.replace === true;
      setState((prev) => {
        const existing = findTab(
          prev.panes,
          (t) => t.href === tab.href || (tab.pageId != null && t.pageId === tab.pageId)
        );
        if (existing) {
          return {
            ...prev,
            focusedPaneId: activate ? existing.pane.id : prev.focusedPaneId,
            panes: prev.panes.map((p) =>
              p.id === existing.pane.id
                ? {
                    ...p,
                    activeTabKey: activate ? existing.tab.key : p.activeTabKey,
                    tabs: p.tabs.map((t) =>
                      t.key === existing.tab.key
                        ? {
                            ...t,
                            title: tab.title || t.title,
                            pageId: tab.pageId ?? t.pageId,
                            scope: tab.scope,
                          }
                        : t
                    ),
                  }
                : p
            ),
          };
        }

        const target =
          prev.panes.find((p) => p.id === paneId) ??
          prev.panes.find((p) => p.id === prev.focusedPaneId) ??
          prev.panes[0];
        if (!target) return emptyWorkspace(tab.scope);

        let panes = prev.panes.map((p) => {
          if (p.id !== target.id) return p;
          if (replace) {
            return {
              ...p,
              tabs: [tab],
              activeTabKey: tab.key,
            };
          }
          return {
            ...p,
            tabs: [...p.tabs, tab],
            activeTabKey: activate ? tab.key : p.activeTabKey,
          };
        });
        if (!replace) {
          panes = trimOldest(panes, tab.key);
        }
        return {
          ...prev,
          panes,
          focusedPaneId: activate ? target.id : prev.focusedPaneId,
        };
      });
    },
    []
  );

  const openInFocused = useCallback(
    (tab: OpenTab) => {
      setState((prev) => {
        const paneId = prev.focusedPaneId;
        const existing = findTab(
          prev.panes,
          (t) =>
            t.href === tab.href ||
            (tab.pageId != null && t.pageId === tab.pageId)
        );
        if (existing) {
          return {
            ...prev,
            focusedPaneId: existing.pane.id,
            panes: prev.panes.map((p) =>
              p.id === existing.pane.id
                ? {
                    ...p,
                    activeTabKey: existing.tab.key,
                    tabs: p.tabs.map((t) =>
                      t.key === existing.tab.key
                        ? {
                            ...t,
                            title: tab.title || t.title,
                            pageId: tab.pageId ?? t.pageId,
                            scope: tab.scope,
                          }
                        : t
                    ),
                  }
                : p
            ),
          };
        }

        const target =
          prev.panes.find((p) => p.id === paneId) ?? prev.panes[0];
        if (!target) return emptyWorkspace(tab.scope);

        let panes = prev.panes.map((p) => {
          if (p.id !== target.id) return p;
          return {
            ...p,
            tabs: [...p.tabs, tab],
            activeTabKey: tab.key,
          };
        });
        panes = trimOldest(panes, tab.key);
        return {
          ...prev,
          panes,
          focusedPaneId: target.id,
        };
      });
    },
    []
  );

  const closeTab = useCallback((paneId: string, tabKey: string) => {
    let nextFocusHref: string | null = null;
    let emptied = false;
    let emptiedState: ReaderWorkspaceState | null = null;

    setState((prev) => {
      let panes = prev.panes
        .map((p) => {
          if (p.id !== paneId) return p;
          const tabs = p.tabs.filter((t) => t.key !== tabKey);
          if (!tabs.length) return null;
          let activeTabKey = p.activeTabKey;
          if (activeTabKey === tabKey) {
            const idx = p.tabs.findIndex((t) => t.key === tabKey);
            const neighbor = tabs[Math.min(idx, tabs.length - 1)];
            activeTabKey = neighbor?.key ?? null;
          }
          const active = tabs.find((t) => t.key === activeTabKey);
          if (active) nextFocusHref = active.href;
          return { ...p, tabs, activeTabKey };
        })
        .filter((p): p is ReaderPane => p != null);

      if (!panes.length) {
        emptied = true;
        emptiedState = emptyPanesWorkspace();
        return emptiedState;
      }

      if (panes.length === 1 && prev.panes.length === 2) {
        // unsplit already handled by filter
      }

      const focusedPaneId = panes.some((p) => p.id === prev.focusedPaneId)
        ? prev.focusedPaneId
        : panes[0]!.id;

      const focused = panes.find((p) => p.id === focusedPaneId);
      if (focused?.activeTabKey) {
        const t = focused.tabs.find((x) => x.key === focused.activeTabKey);
        if (t) nextFocusHref = t.href;
      }

      return { ...prev, panes, focusedPaneId };
    });

    // Persist before navigating to /my-content so Library doesn't reopen closed tabs
    if (emptied && emptiedState) persist(emptiedState);

    return { emptied, nextFocusHref };
  }, []);

  const closeTabsForPageId = useCallback((pageId: string) => {
    let nextFocusHref: string | null = null;
    let emptied = false;
    let emptiedState: ReaderWorkspaceState | null = null;

    setState((prev) => {
      let panes = prev.panes
        .map((p) => {
          const tabs = p.tabs.filter((t) => t.pageId !== pageId);
          if (tabs.length === p.tabs.length) return p;
          let activeTabKey = p.activeTabKey;
          if (activeTabKey && !tabs.some((t) => t.key === activeTabKey)) {
            const idx = p.tabs.findIndex((t) => t.key === activeTabKey);
            const neighbor = tabs[Math.min(Math.max(0, idx), tabs.length - 1)];
            activeTabKey = neighbor?.key ?? tabs[0]?.key ?? null;
          }
          return { ...p, tabs, activeTabKey };
        })
        .filter((p): p is ReaderPane => p != null && p.tabs.length > 0);

      if (!panes.length) {
        emptied = true;
        emptiedState = emptyPanesWorkspace();
        return emptiedState;
      }

      const focusedPaneId = panes.some((p) => p.id === prev.focusedPaneId)
        ? prev.focusedPaneId
        : panes[0]!.id;

      const focused = panes.find((p) => p.id === focusedPaneId);
      if (focused?.activeTabKey) {
        const t = focused.tabs.find((x) => x.key === focused.activeTabKey);
        if (t) nextFocusHref = t.href;
      }

      return { ...prev, panes, focusedPaneId };
    });

    if (emptied && emptiedState) persist(emptiedState);

    return { emptied, nextFocusHref };
  }, []);

  const splitWith = useCallback((tab: OpenTab) => {
    setState((prev) => {
      // Never show the same page in two panes — move the tab to the right.
      const total = totalTabs(prev.panes);
      if (total <= 1) {
        // Need another open tab to keep the left pane non-empty.
        return prev;
      }

      const sourcePane =
        prev.panes.find((p) => p.tabs.some((t) => t.href === tab.href)) ??
        prev.panes[0]!;

      if (prev.panes.length >= 2) {
        const right = prev.panes[1]!;
        const left = prev.panes[0]!;
        const leftTabs = left.tabs.filter((t) => t.href !== tab.href);
        const rightTabs = [
          ...right.tabs.filter((t) => t.href !== tab.href),
          { ...tab, key: tab.href },
        ];
        if (!leftTabs.length) {
          // Would empty left — pull another tab from right if possible
          return prev;
        }
        track(AnalyticsEvents.readerSplitEnabled, { action: "move_tab" });
        return {
          ...prev,
          focusedPaneId: right.id,
          panes: [
            {
              ...left,
              tabs: leftTabs,
              activeTabKey:
                leftTabs.find((t) => t.key === left.activeTabKey)?.key ??
                leftTabs[0]!.key,
            },
            {
              ...right,
              tabs: rightTabs,
              activeTabKey: tab.href,
            },
          ],
        };
      }

      const leftTabs = sourcePane.tabs.filter((t) => t.href !== tab.href);
      if (!leftTabs.length) return prev;

      const rightId = newPaneId();
      track(AnalyticsEvents.readerSplitEnabled, { action: "new_pane" });
      return {
        ...prev,
        focusedPaneId: rightId,
        panes: [
          {
            ...sourcePane,
            tabs: leftTabs,
            activeTabKey:
              leftTabs.find((t) => t.key === sourcePane.activeTabKey)?.key ??
              leftTabs[0]!.key,
          },
          {
            id: rightId,
            tabs: [{ ...tab, key: tab.href }],
            activeTabKey: tab.href,
          },
        ],
      };
    });
  }, []);

  const unsplit = useCallback((keepPaneId: string) => {
    setState((prev) => {
      if (prev.panes.length < 2) return prev;
      const keep = prev.panes.find((p) => p.id === keepPaneId) ?? prev.panes[0]!;
      const other = prev.panes.find((p) => p.id !== keep.id);
      const mergedTabs = [...keep.tabs];
      if (other) {
        for (const t of other.tabs) {
          if (!mergedTabs.some((x) => x.href === t.href)) mergedTabs.push(t);
        }
      }
      const pane: ReaderPane = {
        id: keep.id,
        tabs: mergedTabs,
        activeTabKey: keep.activeTabKey,
      };
      return {
        ...prev,
        panes: [pane],
        focusedPaneId: pane.id,
      };
    });
  }, []);

  const moveTab = useCallback(
    (fromPaneId: string, tabKey: string, toPaneId: string) => {
      setState((prev) => {
        const from = prev.panes.find((p) => p.id === fromPaneId);
        const to = prev.panes.find((p) => p.id === toPaneId);
        if (!from || !to) return prev;
        const tab = from.tabs.find((t) => t.key === tabKey);
        if (!tab) return prev;
        if (fromPaneId === toPaneId) return prev;

        let panes = prev.panes
          .map((p) => {
            if (p.id === fromPaneId) {
              const tabs = p.tabs.filter((t) => t.key !== tabKey);
              if (!tabs.length) return null;
              return {
                ...p,
                tabs,
                activeTabKey:
                  p.activeTabKey === tabKey
                    ? tabs[tabs.length - 1]?.key ?? null
                    : p.activeTabKey,
              };
            }
            if (p.id === toPaneId) {
              if (p.tabs.some((t) => t.href === tab.href)) {
                return {
                  ...p,
                  activeTabKey:
                    p.tabs.find((t) => t.href === tab.href)?.key ?? p.activeTabKey,
                };
              }
              return {
                ...p,
                tabs: [...p.tabs, tab],
                activeTabKey: tab.key,
              };
            }
            return p;
          })
          .filter((p): p is ReaderPane => p != null);

        if (panes.length === 0) return prev;
        panes = trimOldest(panes, tab.key);
        return {
          ...prev,
          panes,
          focusedPaneId: toPaneId,
        };
      });
    },
    []
  );

  const focusedPane =
    state.panes.find((p) => p.id === state.focusedPaneId) ?? state.panes[0] ?? null;
  const focusedTab =
    focusedPane?.tabs.find((t) => t.key === focusedPane.activeTabKey) ??
    focusedPane?.tabs[0] ??
    null;

  return {
    state,
    focusedPane,
    focusedTab,
    setLibraryCollapsed,
    setStudyAICollapsed,
    setSpotifyCollapsed,
    setTelegramCollapsed,
    focusPane,
    activateTab,
    reorderTabs,
    updateTabMeta,
    updateTabsByPageId,
    openInPane,
    openInFocused,
    closeTab,
    closeTabsForPageId,
    splitWith,
    unsplit,
    moveTab,
    syncRoute,
  };
}
