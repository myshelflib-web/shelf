import { pageHref } from "@/lib/myContentTree";
import { learnHref } from "@/lib/learnContent";

export type PersonalPageReaderScope =
  | { kind: "topic"; notebookSlug: string; topicSlug: string; pageSlug: string }
  | { kind: "notebook-file"; notebookSlug: string; pageSlug: string }
  | { kind: "root-file"; pageSlug: string }
  | { kind: "shared"; pageId: string; linkToken?: string }
  | {
      kind: "learn";
      subjectSlug: string;
      topicSlug: string;
      articleSlug: string;
    };

export type OpenTab = {
  /** Stable key — always the page href (never pageId) so tabs don't remount. */
  key: string;
  href: string;
  title: string;
  scope: PersonalPageReaderScope;
  pageId?: string;
};

export type ReaderPane = {
  id: string;
  tabs: OpenTab[];
  activeTabKey: string | null;
};

export type ReaderWorkspaceState = {
  panes: ReaderPane[];
  focusedPaneId: string;
  libraryCollapsed: boolean;
  /** Study AI right panel collapsed (like library). */
  studyAICollapsed: boolean;
  /** Spotify focus-audio dock collapsed. */
  spotifyCollapsed: boolean;
  /** Telegram connect / PDF-import dock collapsed. */
  telegramCollapsed: boolean;
};

export const SHELF_PAGE_MIME = "application/x-shelf-page";

export type ShelfPageDragPayload = {
  href: string;
  title: string;
  pageId: string;
  scope: PersonalPageReaderScope;
};

export const MAX_OPEN_TABS = 15;
export const WORKSPACE_STORAGE_KEY = "shelf:reader-workspace";
export const WORKSPACE_CHANGED_EVENT = "shelf:reader-workspace-changed";

/** Persisted blob — `userId` ties open tabs to the account that created them. */
export type StoredReaderWorkspace = Partial<ReaderWorkspaceState> & {
  userId?: string;
};

function storedAuthUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const id = (JSON.parse(raw) as { id?: unknown })?.id;
    return typeof id === "string" && id ? id : null;
  } catch {
    return null;
  }
}

/**
 * Read workspace from localStorage only if it belongs to the signed-in user.
 * Orphan / other-account tabs are dropped so new accounts don't inherit them.
 */
function migrateLegacyTab(tab: OpenTab): OpenTab {
  if ((tab.scope as { kind: string }).kind !== "preloaded") return tab;
  const legacy = tab.scope as unknown as {
    kind: "preloaded";
    subjectSlug: string;
    topicSlug: string;
    articleSlug: string;
  };
  const scope: PersonalPageReaderScope = {
    kind: "learn",
    subjectSlug: legacy.subjectSlug,
    topicSlug: legacy.topicSlug,
    articleSlug: legacy.articleSlug,
  };
  const href = learnHref(scope.subjectSlug, scope.topicSlug, scope.articleSlug);
  return { ...tab, scope, href, key: href };
}

function migrateStoredWorkspace(
  stored: StoredReaderWorkspace
): StoredReaderWorkspace {
  if (!stored.panes?.length) return stored;
  return {
    ...stored,
    panes: stored.panes.map((pane) =>
      pane
        ? {
            ...pane,
            tabs: pane.tabs?.map((tab) =>
              tab?.scope ? migrateLegacyTab(tab as OpenTab) : tab
            ),
          }
        : pane
    ),
  };
}

export function readOwnedWorkspace(): StoredReaderWorkspace | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredReaderWorkspace;
    const userId = storedAuthUserId();
    if (!userId || stored.userId !== userId) {
      localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      return null;
    }
    return migrateStoredWorkspace(stored);
  } catch {
    return null;
  }
}

export function writeOwnedWorkspace(state: ReaderWorkspaceState) {
  if (typeof window === "undefined") return;
  try {
    const userId = storedAuthUserId();
    if (!userId) return;
    localStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify({ ...state, userId } satisfies StoredReaderWorkspace)
    );
    notifyWorkspaceChanged();
  } catch {
    /* ignore quota */
  }
}

/** Library nav target: focused open tab, or empty library home. */
export function getLibraryHref(): string {
  return getFocusedWorkspaceHref() ?? "/my-content";
}

export function notifyWorkspaceChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(WORKSPACE_CHANGED_EVENT));
}

export function scopeHref(scope: PersonalPageReaderScope): string {
  if (scope.kind === "learn") {
    return `/learn/${scope.subjectSlug}/${scope.topicSlug}/${scope.articleSlug}`;
  }
  if (scope.kind === "shared") {
    const t = scope.linkToken
      ? `?t=${encodeURIComponent(scope.linkToken)}`
      : "";
    return `/my-content/shared/${scope.pageId}${t}`;
  }
  if (scope.kind === "root-file") return pageHref(null, null, scope.pageSlug);
  if (scope.kind === "notebook-file")
    return pageHref(scope.notebookSlug, null, scope.pageSlug);
  return pageHref(scope.notebookSlug, scope.topicSlug, scope.pageSlug);
}

export function navHref(
  scope: PersonalPageReaderScope,
  pageSlug: string
): string {
  if (scope.kind === "learn") {
    return `/learn/${scope.subjectSlug}/${scope.topicSlug}/${pageSlug}`;
  }
  if (scope.kind === "shared") {
    return `/my-content/shared/${scope.pageId}`;
  }
  if (scope.kind === "root-file") return pageHref(null, null, pageSlug);
  if (scope.kind === "notebook-file")
    return pageHref(scope.notebookSlug, null, pageSlug);
  return pageHref(scope.notebookSlug, scope.topicSlug, pageSlug);
}

export function afterDeletePath(_scope: PersonalPageReaderScope): string {
  return "/my-content";
}

export function scopeFromHref(href: string): PersonalPageReaderScope | null {
  const path = href.split("?")[0] ?? href;
  const search = href.includes("?") ? href.slice(href.indexOf("?") + 1) : "";
  const linkToken = new URLSearchParams(search).get("t") ?? undefined;
  const learnMatch = path.match(/^\/learn\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (learnMatch) {
    return {
      kind: "learn",
      subjectSlug: learnMatch[1]!,
      topicSlug: learnMatch[2]!,
      articleSlug: learnMatch[3]!,
    };
  }
  const sharedMatch = path.match(/^\/my-content\/shared\/([^/]+)$/);
  if (sharedMatch) {
    return {
      kind: "shared",
      pageId: sharedMatch[1]!,
      ...(linkToken ? { linkToken } : {}),
    };
  }
  const parts = path.replace(/^\/my-content\/?/, "").split("/").filter(Boolean);
  if (parts.length === 2 && parts[0] === "file") {
    return { kind: "root-file", pageSlug: parts[1]! };
  }
  if (parts.length === 3 && parts[1] === "file") {
    return {
      kind: "notebook-file",
      notebookSlug: parts[0]!,
      pageSlug: parts[2]!,
    };
  }
  if (parts.length === 3) {
    return {
      kind: "topic",
      notebookSlug: parts[0]!,
      topicSlug: parts[1]!,
      pageSlug: parts[2]!,
    };
  }
  return null;
}

export function tabFromScope(
  scope: PersonalPageReaderScope,
  title = "Untitled",
  pageId?: string
): OpenTab {
  const href = scopeHref(scope);
  return {
    key: href,
    href,
    title,
    scope,
    pageId,
  };
}

export function newPaneId(): string {
  return `pane-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyPanesWorkspace(): ReaderWorkspaceState {
  const paneId = newPaneId();
  return {
    panes: [{ id: paneId, tabs: [], activeTabKey: null }],
    focusedPaneId: paneId,
    libraryCollapsed: false,
    studyAICollapsed: false,
    spotifyCollapsed: true,
    telegramCollapsed: true,
  };
}

/** Active reader tab href from persisted workspace, or null if none open. */
export function getFocusedWorkspaceHref(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = readOwnedWorkspace();
    if (!stored?.panes?.length) return null;
    const focused =
      stored.panes.find((p) => p?.id === stored.focusedPaneId) ??
      stored.panes[0];
    if (!focused?.tabs?.length) return null;
    const tab =
      focused.tabs.find((t) => t?.key === focused.activeTabKey) ??
      focused.tabs[0];
    return tab?.href ?? null;
  } catch {
    return null;
  }
}

export function emptyWorkspace(scope: PersonalPageReaderScope): ReaderWorkspaceState {
  const tab = tabFromScope(scope);
  const paneId = newPaneId();
  return {
    panes: [{ id: paneId, tabs: [tab], activeTabKey: tab.key }],
    focusedPaneId: paneId,
    libraryCollapsed: false,
    studyAICollapsed: false,
    spotifyCollapsed: true,
    telegramCollapsed: true,
  };
}
