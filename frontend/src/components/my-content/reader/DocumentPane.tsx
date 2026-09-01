"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PersonalContentArea } from "@/components/my-content/PersonalContentArea";
import { PdfViewer, type PdfViewerCommands } from "@/components/my-content/PdfViewer";
import { EmbedViewer } from "@/components/my-content/EmbedViewer";
import { VideoPageView } from "@/components/my-content/VideoPageView";
import type { SketchZoomCommands } from "@/components/my-content/useSketchNotebookZoom";
import { api, getStoredUser } from "@/lib/api";
import {
  AnalyticsEvents,
  AnalyticsFirstTimeFlags,
  track,
  trackOncePerUser,
} from "@/lib/analytics";
import { captureVisibleSketchPage } from "@/lib/captureSketchPage";
import { listHighlights } from "@/lib/offline/highlights";
import {
  highlightPageOffset,
  scrollHtmlHighlight,
} from "@/lib/highlightNavigation";
import { updatePageProgress } from "@/lib/offline/progress";
import { requireOnline } from "@/lib/offline/notice";
import { syncPageInTree } from "@/lib/myContentTree";
import { emitContentChanged, emitPageRenamed, emitPageDeleted } from "@/lib/contentEvents";
import { removeCachedPdf } from "@/lib/pdfByteCache";
import {
  UserSubject,
  UserContentHighlight,
  UserContentType,
} from "@/types";
import { Lock, ChevronRight, Sparkles, X } from "lucide-react";
import { PaywallBanner } from "@/components/PaywallBanner";
import { RenameButton } from "@/components/my-content/RenameButton";
import { ReadProgressBar } from "@/components/my-content/ReadProgressBar";
import { SharePageModal } from "@/components/my-content/SharePageModal";
import {
  AccessDeniedState,
  DocumentChromeActions,
  SharedByBanner,
} from "./SharedDocChrome";
import { PreloadedSaveBanner } from "./PreloadedSaveBanner";
import {
  promptPreloadedSave,
  resolveAnnotationLock,
} from "@/lib/preloadedReadOnly";
import { ApiError } from "@/lib/api";
import { StudyPanel } from "@/components/StudyPanel";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useIsPhone } from "@/hooks/useIsPhone";
import { useAppDialog } from "@/hooks/useAppDialog";
import {
  getTabViewState,
  pickNewerView,
  setTabViewState,
  toServerView,
  viewStateFromPage,
  type TabViewState,
} from "@/lib/tabViewState";
import {
  OpenTab,
  PersonalPageReaderScope,
  SHELF_PAGE_MIME,
  afterDeletePath,
  getLibraryHref,
  navHref,
  scopeHref,
} from "./types";
import { shouldSkipLibraryNav } from "@/hooks/useLibraryHref";
import { CircleLoader } from "@/components/CircleLoader";
import clsx from "clsx";
import { isLiveEditorHtml } from "@/lib/pageKinds";
import { linkEmbedHint, shouldUseLinkEmbed } from "@/lib/linkEmbedPolicy";
import { resolvePreloadedLearnPage } from "@/lib/preloadedLearnPage";
import { useDocumentPaneFlags } from "./useDocumentPaneFlags";

const FS_AI_WIDTH_KEY = "shelf:fullscreen-study-ai-width";
const FS_AI_WIDTH_DEFAULT = 384;
const FS_AI_WIDTH_MIN = 260;
const FS_AI_WIDTH_MAX_RATIO = 0.55;

function readFsAiWidth(): number {
  if (typeof window === "undefined") return FS_AI_WIDTH_DEFAULT;
  const raw = Number(localStorage.getItem(FS_AI_WIDTH_KEY));
  if (!Number.isFinite(raw) || raw < FS_AI_WIDTH_MIN) return FS_AI_WIDTH_DEFAULT;
  return Math.round(raw);
}

function clampFsAiWidth(width: number, shellWidth: number): number {
  const max = Math.max(
    FS_AI_WIDTH_MIN,
    Math.floor(shellWidth * FS_AI_WIDTH_MAX_RATIO)
  );
  return Math.min(max, Math.max(FS_AI_WIDTH_MIN, Math.round(width)));
}

type NavItem = { slug: string; title: string } | null;

export interface LoadedPage {
  id: string;
  title: string;
  content: string;
  contentType: UserContentType;
  sourceUrl?: string | null;
  completed: boolean;
  starred: boolean;
  readPercent: number;
  navigation: { prev: NavItem; next: NavItem };
  notebookSlug: string | null;
  topicSlug: string | null;
  notebookMeta: { name: string; slug: string; icon: string } | null;
  topicMeta: { title: string; slug: string } | null;
  isPreloaded?: boolean;
  isLocked?: boolean;
  saveAllowed?: boolean;
  saveReason?: string | null;
  embeddable?: boolean | null;
  linkStatus?: string | null;
  subjectMeta?: { name: string; slug: string; icon?: string | null } | null;
  /** Present when opened via share / link. */
  access?: import("@/types").PageAccessInfo;
  accessDenied?: boolean;
}

async function fetchCurriculumPage(
  scope: Extract<PersonalPageReaderScope, { kind: "learn" }>
) {
  const res = await api.subjects.getArticle(
    scope.subjectSlug,
    scope.topicSlug,
    scope.articleSlug
  );
  const { article, progress, starred, navigation } = res;
  const resolved = resolvePreloadedLearnPage(article);
  return {
    page: {
      id: article.id,
      title: article.title,
      content: resolved.content,
      contentType: resolved.contentType,
      sourceUrl: resolved.sourceUrl,
      completed: progress.completed ?? false,
      starred,
      readPercent: progress.readPercent ?? 0,
    },
    navigation: {
      prev: navigation.prev,
      next: navigation.next,
    },
    isPreloaded: true as const,
    isLocked: article.isLocked,
    saveAllowed: article.saveAllowed !== false,
    saveReason: article.saveReason ?? null,
    embeddable: article.embeddable ?? null,
    linkStatus: article.linkStatus ?? null,
    subjectMeta: article.topic.subject,
    topicMeta: { title: article.topic.title, slug: article.topic.slug },
  };
}

async function fetchPage(scope: PersonalPageReaderScope): Promise<{
  page: import("@/types").UserPageDetail;
  navigation: { prev: NavItem; next: NavItem };
  isPreloaded?: boolean;
  isLocked?: boolean;
  saveAllowed?: boolean;
  saveReason?: string | null;
  embeddable?: boolean | null;
  linkStatus?: string | null;
  subjectMeta?: { name: string; slug: string; icon?: string | null } | null;
  topicMeta?: { title: string; slug: string } | null;
  access?: import("@/types").PageAccessInfo;
  accessDenied?: boolean;
}> {
  if (scope.kind === "learn") {
    const curriculum = await fetchCurriculumPage(scope);
    return {
      page: curriculum.page as import("@/types").UserPageDetail,
      navigation: curriculum.navigation,
      isPreloaded: true,
      isLocked: curriculum.isLocked,
      saveAllowed: curriculum.saveAllowed,
      saveReason: curriculum.saveReason,
      embeddable: curriculum.embeddable,
      linkStatus: curriculum.linkStatus,
      subjectMeta: curriculum.subjectMeta,
      topicMeta: curriculum.topicMeta,
    };
  }
  if (scope.kind === "shared") {
    try {
      const res = await api.myContent.getPageById(
        scope.pageId,
        scope.linkToken
      );
      return {
        page: res.page,
        navigation: res.navigation,
        access: res.access,
      };
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        return {
          page: {
            id: scope.pageId,
            title: "Access removed",
            slug: "access-removed",
            content: "",
            status: "DRAFT",
            contentType: "HTML",
            hasPdf: false,
            completed: false,
            readPercent: 0,
            starred: false,
            isPersonal: true,
            notebook: null,
            topic: null,
          },
          navigation: { prev: null, next: null },
          accessDenied: true,
        };
      }
      throw err;
    }
  }
  if (scope.kind === "root-file") {
    return api.myContent.getRootPage(scope.pageSlug);
  }
  if (scope.kind === "notebook-file") {
    return api.myContent.getNotebookFilePage(
      scope.notebookSlug,
      scope.pageSlug
    );
  }
  return api.myContent.getPage(
    scope.notebookSlug,
    scope.topicSlug,
    scope.pageSlug
  );
}

export type DocumentPaneSnapshot = {
  paneId: string;
  tabKey: string;
  pageData: LoadedPage | null;
  loading: boolean;
  editing: boolean;
  /** Blank canvas is always in the editor — no Edit/Done chrome. */
  liveEdit: boolean;
  saving: boolean;
  htmlClip: boolean;
  scope: PersonalPageReaderScope;
  currentHref: string;
  scrollContainer: HTMLElement | null;
  contentRoot: HTMLElement | null;
  pdfPage: number | null;
  pdfNumPages: number | null;
  readPercent: number;
  highlights: UserContentHighlight[];
  highlightsHydrating: boolean;
};

export type DocumentPaneHandlers = {
  startEditing: () => void;
  saveEditing: () => Promise<void>;
  flushEditing: () => Promise<void>;
  cancelEditing: () => void;
  handleToggleComplete: () => Promise<void>;
  handleToggleStar: () => Promise<void>;
  handleDelete: () => Promise<void>;
  openStudyAI: (
    selection?: string,
    imageBase64?: string,
    onAttachNote?: (note: string) => Promise<void>
  ) => void;
  setHtmlClip: (v: boolean | ((prev: boolean) => boolean)) => void;
  navHref: (pageSlug: string) => string;
  reloadPage: () => void;
  toggleFullscreen: () => void;
  pdfZoomIn: () => void;
  pdfZoomOut: () => void;
  pdfToggleNight: () => void;
  pdfNextPage: () => void;
  pdfPrevPage: () => void;
  /** PDF canvas JPEG, or sketch notebook sheet when the open page is ink. */
  capturePdfPage: () => string;
  scrollToHighlight: (highlight: UserContentHighlight) => void;
};

interface DocumentPaneProps {
  tab: OpenTab;
  paneId: string;
  focused: boolean;
  notebook: UserSubject | null;
  showChrome?: boolean;
  onMeta: (patch: { title?: string; pageId?: string }) => void;
  onNotebookPatch: (
    updater: (prev: UserSubject | null) => UserSubject | null
  ) => void;
  onSnapshot: (snapshot: DocumentPaneSnapshot) => void;
  onHandlers: (handlers: DocumentPaneHandlers) => void;
  onAskStudyAI: (
    pageId: string,
    selection?: string,
    imageBase64?: string,
    onAttachNote?: (note: string) => Promise<void>,
    embedMode?: boolean
  ) => void;
  /** Workspace Study AI panel is currently open (for fullscreen enter/exit sync). */
  workspaceStudyAIOpen?: boolean;
  onCloseStudyAI?: () => void;
  onClipImage: (data: string, page: LoadedPage) => void;
  onNavigate: (href: string) => void;
  /** Close this reader tab immediately after the user deletes the open page. */
  onPageDeleted?: () => void;
  onDropPage: (tab: OpenTab) => void;
  onReadPercent: (pageId: string, percent: number) => void;
  signInGate?: {
    active: boolean;
    prompt: (feature: string) => void;
  };
}

export function DocumentPane({
  tab,
  paneId,
  focused,
  notebook,
  showChrome = true,
  onMeta,
  onNotebookPatch,
  onSnapshot,
  onHandlers,
  onAskStudyAI,
  workspaceStudyAIOpen = false,
  onCloseStudyAI,
  onClipImage,
  onNavigate,
  onPageDeleted,
  onDropPage,
  onReadPercent,
  signInGate,
}: DocumentPaneProps) {
  const { confirm, alert } = useAppDialog();
  const isPhone = useIsPhone();
  const scope = tab.scope;
  const [pageData, setPageData] = useState<LoadedPage | null>(null);
  const [highlights, setHighlights] = useState<UserContentHighlight[]>([]);
  const [highlightsHydrating, setHighlightsHydrating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "dirty" | "saving" | "saved" | "error"
  >("idle");
  const lastSavedHtml = useRef("");
  const autosaveTimer = useRef<number | null>(null);
  const saveGen = useRef(0);
  const draftContentRef = useRef("");
  const editingRef = useRef(false);
  /** Stable HTML passed into live editors so keystrokes don't re-feed props (focus loss). */
  const [editorSeed, setEditorSeed] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftUrl, setDraftUrl] = useState("");
  editingRef.current = editing;
  const [htmlClip, setHtmlClip] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const pdfCommandsRef = useRef<PdfViewerCommands | null>(null);
  const sketchZoomRef = useRef<SketchZoomCommands | null>(null);
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(shellRef);
  const [fsAiOpen, setFsAiOpen] = useState(false);
  const [fsAiWidth, setFsAiWidth] = useState(FS_AI_WIDTH_DEFAULT);
  const [fsAiResizing, setFsAiResizing] = useState(false);
  const [fsSelection, setFsSelection] = useState<string | null>(null);
  const [fsImage, setFsImage] = useState<string | undefined>();
  const fsAttachNoteRef = useRef<
    ((note: string) => Promise<void>) | undefined
  >(undefined);
  const fsAiOpenRef = useRef(false);
  const fsSelectionRef = useRef<string | null>(null);
  const fsImageRef = useRef<string | undefined>(undefined);
  const wasFullscreenRef = useRef(false);
  fsAiOpenRef.current = fsAiOpen;
  fsSelectionRef.current = fsSelection;
  fsImageRef.current = fsImage;
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);
  const [contentRoot, setContentRoot] = useState<HTMLElement | null>(null);
  const [pdfInfo, setPdfInfo] = useState<{ page: number; numPages: number } | null>(
    null
  );
  const lastPersistedPercent = useRef(-1);
  const [liveReadPercent, setLiveReadPercent] = useState(0);
  const persistTimer = useRef<number | null>(null);
  const viewTimer = useRef<number | null>(null);
  const viewRef = useRef<TabViewState>({});
  const pageIdRef = useRef<string | null>(null);
  const pageLoadGen = useRef(0);
  const loadedHrefRef = useRef<string | null>(null);

  const currentHref = scopeHref(scope);
  const [savedView, setSavedView] = useState<TabViewState | undefined>(() =>
    getTabViewState(currentHref)
  );

  useEffect(() => {
    const local = getTabViewState(currentHref);
    viewRef.current = local ?? {};
    setSavedView(local);
  }, [currentHref]);

  const flushViewToServer = useCallback((pageId: string, view: TabViewState) => {
    if (scope.kind === "learn" || scope.kind === "shared") return;
    const payload = toServerView(view);
    if (
      payload.pdfPage == null &&
      payload.pageOffset == null &&
      payload.scrollTop == null &&
      payload.scale == null
    ) {
      return;
    }
    updatePageProgress(pageId, { view: payload }).catch(() => undefined);
  }, [scope.kind]);

  const persistView = useCallback(
    (patch: {
      pdfPage?: number;
      pageOffset?: number;
      scrollTop?: number;
      scrollLeft?: number;
      scale?: number;
      darkPdf?: boolean;
    }) => {
      const next = { ...viewRef.current, ...patch, updatedAt: Date.now() };
      viewRef.current = next;
      setTabViewState(currentHref, next);
      const pageId = pageIdRef.current;
      if (!pageId) return;
      if (viewTimer.current) window.clearTimeout(viewTimer.current);
      viewTimer.current = window.setTimeout(() => {
        flushViewToServer(pageId, viewRef.current);
      }, 1200);
    },
    [currentHref, flushViewToServer]
  );

  const onSnapshotRef = useRef(onSnapshot);
  const onHandlersRef = useRef(onHandlers);
  const onMetaRef = useRef(onMeta);
  onSnapshotRef.current = onSnapshot;
  onHandlersRef.current = onHandlers;
  onMetaRef.current = onMeta;

  const reloadPage = useCallback(() => {
    const gen = ++pageLoadGen.current;
    const href = currentHref;
    const sameDocument =
      loadedHrefRef.current === href && pageIdRef.current != null;
    if (!sameDocument) {
      setLoading(true);
      setHighlights([]);
      setHighlightsHydrating(true);
    }
    fetchPage(scope)
      .then((result) => {
        if (gen !== pageLoadGen.current) return;
        const {
          page,
          navigation,
          isPreloaded,
          isLocked,
          saveAllowed,
          saveReason,
          embeddable,
          linkStatus,
          subjectMeta,
          topicMeta,
          access,
          accessDenied,
        } = result;
        if (accessDenied) {
          loadedHrefRef.current = href;
          setPageData({
            id: page.id,
            title: page.title,
            content: "",
            contentType: "HTML",
            completed: false,
            starred: false,
            readPercent: 0,
            navigation: { prev: null, next: null },
            notebookSlug: null,
            topicSlug: null,
            notebookMeta: null,
            topicMeta: null,
            accessDenied: true,
          });
          setLoading(false);
          return;
        }
        const loaded: LoadedPage = {
          id: page.id,
          title: page.title,
          content:
            page.content ??
            (page.contentType === "PDF" || page.contentType === "LINK"
              ? ""
              : "<p>Content not available yet.</p>"),
          contentType: page.contentType,
          sourceUrl: page.sourceUrl,
          completed: page.completed ?? false,
          starred: page.starred ?? false,
          readPercent: page.readPercent ?? 0,
          navigation,
          notebookSlug: isPreloaded
            ? subjectMeta?.slug ?? null
            : page.notebook?.slug ?? null,
          topicSlug: isPreloaded
            ? topicMeta?.slug ?? null
            : page.topic?.slug ?? null,
          notebookMeta: isPreloaded
            ? subjectMeta
              ? {
                  name: subjectMeta.name,
                  slug: subjectMeta.slug,
                  icon: subjectMeta.icon ?? "📚",
                }
              : null
            : page.notebook,
          topicMeta: isPreloaded ? topicMeta ?? null : page.topic,
          isPreloaded,
          isLocked,
          saveAllowed,
          saveReason,
          embeddable,
          linkStatus,
          subjectMeta: subjectMeta ?? null,
          access,
        };
        setPageData(loaded);
        setLiveReadPercent(loaded.readPercent);
        lastPersistedPercent.current = loaded.readPercent;
        pageIdRef.current = loaded.id;
        loadedHrefRef.current = href;
        if (!isPreloaded && scope.kind !== "learn") {
          const contentType = loaded.contentType ?? "HTML";
          track(AnalyticsEvents.readerOpened, {
            contentType,
            scopeKind: scope.kind,
            pageId: loaded.id,
          });
          const userId = getStoredUser()?.id;
          if (userId) {
            trackOncePerUser(userId, AnalyticsFirstTimeFlags.pageOpened, AnalyticsEvents.firstPageOpened, {
              contentType,
              scopeKind: scope.kind,
            });
          }
          if (page.status === "FAILED") {
            track(AnalyticsEvents.pdfProcessingFailed, {
              pageId: loaded.id,
              contentType,
            });
          }
        }
        const merged = pickNewerView(
          getTabViewState(currentHref),
          isPreloaded ? undefined : viewStateFromPage(page.view)
        );
        if (merged) {
          viewRef.current = merged;
          setTabViewState(currentHref, merged);
          setSavedView(merged);
        }
        onMetaRef.current({ title: loaded.title, pageId: loaded.id });
        if (
          !isPreloaded &&
          loaded.contentType === "HTML" &&
          isLiveEditorHtml(loaded.content)
        ) {
          draftContentRef.current = loaded.content;
          setDraftContent(loaded.content);
          setEditorSeed(loaded.content);
          lastSavedHtml.current = loaded.content;
          setEditing(true);
          setSaveStatus("idle");
        } else {
          draftContentRef.current = loaded.content ?? "";
          setDraftContent(loaded.content ?? "");
          setEditorSeed("");
          setEditing(false);
          setSaveStatus("idle");
        }
        // Show the document immediately; hydrate highlights in the background.
        setLoading(false);
        if (isPreloaded) {
          setHighlightsHydrating(false);
          return;
        }
        void (async () => {
          try {
            const hl = await listHighlights(page.id);
            if (gen !== pageLoadGen.current) return;
            setHighlights(hl);
          } catch {
            try {
              const { highlights: serverHl } =
                await api.myContent.listHighlights(
                  page.id,
                  scope.kind === "shared" ? scope.linkToken : undefined
                );
              if (gen !== pageLoadGen.current) return;
              setHighlights(serverHl);
            } catch {
              if (gen !== pageLoadGen.current) return;
              setHighlights([]);
            }
          } finally {
            if (gen === pageLoadGen.current) setHighlightsHydrating(false);
          }
        })();
      })
      .catch(() => {
        if (gen !== pageLoadGen.current) return;
        pageIdRef.current = null;
        loadedHrefRef.current = null;
        setPageData(null);
        setLiveReadPercent(0);
        setLoading(false);
      });
  }, [scope, currentHref]);

  useEffect(() => {
    reloadPage();
    return () => {
      pageLoadGen.current += 1;
    };
  }, [reloadPage]);

  useEffect(() => {
    setFsAiWidth(readFsAiWidth());
  }, []);

  useEffect(() => {
    const wasFullscreen = wasFullscreenRef.current;
    wasFullscreenRef.current = isFullscreen;

    if (!wasFullscreen && isFullscreen) {
      // Entering fullscreen — bring workspace Study AI along if it was open.
      if (workspaceStudyAIOpen) setFsAiOpen(true);
      return;
    }

    if (wasFullscreen && !isFullscreen) {
      // Keep Study AI open in the workspace panel after leaving fullscreen.
      if (fsAiOpenRef.current && pageData) {
        onAskStudyAI(
          pageData.id,
          fsSelectionRef.current ?? undefined,
          fsImageRef.current,
          fsAttachNoteRef.current,
          pageData.contentType === "LINK"
        );
      } else {
        onCloseStudyAI?.();
      }
      setFsAiOpen(false);
      setFsSelection(null);
      setFsImage(undefined);
      fsAttachNoteRef.current = undefined;
      setFsAiResizing(false);
    }
  }, [isFullscreen, pageData, onAskStudyAI, onCloseStudyAI, workspaceStudyAIOpen]);

  const onFsAiResizePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const shell = shellRef.current;
      if (!shell) return;
      const startX = e.clientX;
      const startWidth = fsAiWidth;
      const shellWidth = shell.getBoundingClientRect().width;
      setFsAiResizing(true);

      const onMove = (ev: PointerEvent) => {
        const next = clampFsAiWidth(
          startWidth + (startX - ev.clientX),
          shellWidth
        );
        setFsAiWidth(next);
      };
      const onUp = (ev: PointerEvent) => {
        setFsAiResizing(false);
        const next = clampFsAiWidth(
          startWidth + (startX - ev.clientX),
          shellWidth
        );
        setFsAiWidth(next);
        try {
          localStorage.setItem(FS_AI_WIDTH_KEY, String(next));
        } catch {
          /* ignore quota */
        }
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [fsAiWidth]
  );

  const openStudyAI = useCallback(
    (
      selection?: string,
      imageBase64?: string,
      onAttachNote?: (note: string) => Promise<void>
    ) => {
      if (!pageData) return;
      // Fullscreen only covers this pane — dock AI inside it so it stays visible.
      if (isFullscreen || document.fullscreenElement === shellRef.current) {
        setFsSelection(selection ?? null);
        setFsImage(imageBase64);
        fsAttachNoteRef.current = onAttachNote;
        setFsAiOpen(true);
        return;
      }
      if (!requireOnline("Study AI")) return;
      onAskStudyAI(
        pageData.id,
        selection,
        imageBase64,
        onAttachNote,
        pageData.contentType === "LINK"
      );
    },
    [pageData, isFullscreen, onAskStudyAI]
  );

  const scrollToHighlight = useCallback(
    (highlight: UserContentHighlight) => {
      if (pageData?.contentType === "PDF") {
        pdfCommandsRef.current?.scrollToHighlight(
          highlight.pageNumber ?? 1,
          highlightPageOffset(highlight)
        );
        return;
      }
      if (scrollEl && contentRoot) {
        scrollHtmlHighlight(scrollEl, contentRoot, highlight.id);
      }
    },
    [pageData?.contentType, scrollEl, contentRoot]
  );

  const { handleToggleComplete, handleToggleStar } = useDocumentPaneFlags({
    pageData,
    setPageData,
    onNotebookPatch,
    signInGate,
  });

  const handleDelete = useCallback(async () => {
    if (pageData?.isPreloaded) return;
    if (!requireOnline("Delete files")) return;
    if (!pageData) return;
    const ok = await confirm({
      title: "Delete file",
      message: `Delete "${pageData.title}"? This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const pageId = pageData.id;
    const title = pageData.title;
    if (onPageDeleted) onPageDeleted();
    else onNavigate(afterDeletePath(scope));
    emitPageDeleted(pageId);
    void removeCachedPdf(pageId);
    void api.myContent.deletePage(pageId).catch(async () => {
      emitContentChanged();
      await alert({
        title: "Delete failed",
        message: `Could not delete "${title}". Refresh the library and try again.`,
      });
    });
  }, [pageData, scope, onNavigate, onPageDeleted, confirm, alert]);

  const startEditing = useCallback(() => {
    if (!pageData || pageData.isPreloaded) return;
    if (pageData.contentType === "PDF") return;
    if (pageData.contentType === "VIDEO") return;
    if (pageData.contentType === "LINK") {
      setDraftTitle(pageData.title);
      setDraftUrl(pageData.sourceUrl ?? "");
      setEditing(true);
      setSaveStatus("idle");
      return;
    }
    draftContentRef.current = pageData.content;
    setDraftContent(pageData.content);
    setEditorSeed(
      isLiveEditorHtml(pageData.content) ? pageData.content : ""
    );
    lastSavedHtml.current = pageData.content;
    setEditing(true);
    setSaveStatus("idle");
  }, [pageData]);

  const persistHtmlContent = useCallback(
    async (html: string, opts?: { exitEdit?: boolean }) => {
      if (!pageData || pageData.contentType === "LINK" || pageData.contentType === "VIDEO") return;
      if (!requireOnline("Save page edits")) return;
      const live =
        !pageData.isPreloaded && isLiveEditorHtml(html || pageData.content);
      const exitEdit = Boolean(opts?.exitEdit) && !live;
      const gen = ++saveGen.current;
      setSaving(true);
      setSaveStatus("saving");
      try {
        const { content } = await api.myContent.updateContent(pageData.id, html);
        if (gen !== saveGen.current) return;
        lastSavedHtml.current = exitEdit ? content : html;
        setPageData((prev) => (prev ? { ...prev, content } : prev));
        if (exitEdit) {
          setDraftContent(content);
          setHighlights([]);
          setEditing(false);
        }
        setSaveStatus("saved");
      } catch (err) {
        if (gen !== saveGen.current) return;
        setSaveStatus("error");
        if (exitEdit) {
          void alert({
            title: "Could not save",
            message: err instanceof Error ? err.message : "Could not save",
          });
        }
        throw err;
      } finally {
        if (gen === saveGen.current) setSaving(false);
      }
    },
    [pageData, alert]
  );

  const flushEditing = useCallback(async () => {
    if (!pageData || pageData.contentType !== "HTML") return;
    const html = draftContentRef.current;
    if (!html.trim() || html === lastSavedHtml.current) return;
    try {
      await persistHtmlContent(html);
    } catch {
      /* status already set */
    }
  }, [pageData, persistHtmlContent]);

  const saveEditing = useCallback(async () => {
    if (!pageData) return;
    if (pageData.contentType === "LINK") {
      if (!requireOnline("Save link pages")) return;
      setSaving(true);
      try {
        const { sourceUrl, title } = await api.myContent.updateSource(
          pageData.id,
          { sourceUrl: draftUrl, title: draftTitle }
        );
        setPageData({ ...pageData, sourceUrl, title });
        onMeta({ title });
        onNotebookPatch((prev) =>
          prev ? syncPageInTree([prev], pageData.id, { title })[0] : prev
        );
        emitPageRenamed(pageData.id, title);
        setEditing(false);
      } catch (err) {
        void alert({
          title: "Could not save",
          message: err instanceof Error ? err.message : "Could not save",
        });
      } finally {
        setSaving(false);
      }
      return;
    }
    const html = draftContentRef.current;
    const live =
      pageData.contentType === "HTML" &&
      !pageData.isPreloaded &&
      isLiveEditorHtml(html || pageData.content);
    if (!html.trim() || html === lastSavedHtml.current) {
      if (!live) {
        setEditing(false);
        setSaveStatus("idle");
      }
      return;
    }
    try {
      await persistHtmlContent(html, { exitEdit: !live });
    } catch {
      /* alerted in persistHtmlContent when exitEdit */
    }
  }, [
    pageData,
    draftUrl,
    draftTitle,
    onMeta,
    onNotebookPatch,
    persistHtmlContent,
    alert,
  ]);

  const importLinkPage = useCallback(async () => {
    if (!pageData || pageData.contentType !== "LINK") return;
    const { page } = await api.myContent.importLink(pageData.id);
    onMeta({ title: page.title, pageId: page.id });
    onNotebookPatch((prev) =>
      prev
        ? syncPageInTree([prev], page.id, {
            title: page.title,
            contentType: page.contentType,
          })[0]
        : prev
    );
    emitContentChanged();
    reloadPage();
  }, [pageData, onMeta, onNotebookPatch, reloadPage]);

  // Autosave live sketch/doc (and legacy blank) from the draft ref — do not
  // depend on draftContent state, which we avoid updating every keystroke.
  const scheduleLiveAutosave = useCallback(() => {
    if (!editingRef.current || !pageData || pageData.contentType !== "HTML") {
      return;
    }
    const html = draftContentRef.current;
    if (!html.trim() || html === lastSavedHtml.current) return;
    setSaveStatus((s) => (s === "dirty" ? s : "dirty"));
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      void persistHtmlContent(draftContentRef.current).catch(() => undefined);
    }, 400);
  }, [pageData, persistHtmlContent]);

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
  }, [pageData?.id]);

  // Flush pending edits when leaving the page / tab
  useEffect(() => {
    const pageId = pageData?.id;
    const isHtml = pageData?.contentType === "HTML";
    const flush = () => {
      if (!editingRef.current || !isHtml || !pageId) return;
      const html = draftContentRef.current;
      if (!html.trim() || html === lastSavedHtml.current) return;
      void api.myContent.updateContent(pageId, html).catch(() => undefined);
    };
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      flush();
    };
  }, [pageData?.id, pageData?.contentType]);

  const cancelEditing = useCallback(() => {
    if (pageData?.contentType === "HTML") {
      const live =
        !pageData.isPreloaded &&
        isLiveEditorHtml(draftContentRef.current || pageData.content);
      if (live) {
        void flushEditing();
        return;
      }
      void saveEditing();
      return;
    }
    setEditing(false);
    setSaveStatus("idle");
  }, [pageData, saveEditing, flushEditing]);

  const handleReadProgress = useCallback(
    (percent: number) => {
      if (!pageData) return;
      setLiveReadPercent(percent);
      onReadPercent(pageData.id, percent);
      if (signInGate?.active) return;
      if (Math.abs(percent - lastPersistedPercent.current) < 2) return;
      if (persistTimer.current) window.clearTimeout(persistTimer.current);
      persistTimer.current = window.setTimeout(() => {
        lastPersistedPercent.current = percent;
        if (pageData.isPreloaded) {
          if (!requireOnline("Save reading progress")) return;
          api.progress.update(pageData.id, { readPercent: percent }).catch(() => undefined);
        } else {
          updatePageProgress(pageData.id, { readPercent: percent }).catch(() => undefined);
        }
      }, 1000);
    },
    [pageData, onReadPercent, signInGate]
  );

  const isPreloadedDoc = Boolean(pageData?.isPreloaded);
  const isSharedRecipient = Boolean(
    pageData?.access && !pageData.access.isOwner
  );
  const curriculumPdfSource =
    scope.kind === "learn"
      ? () =>
          api.subjects.getArticlePdfUrl(
            scope.subjectSlug,
            scope.topicSlug,
            scope.articleSlug
          )
      : undefined;
  const sharedPdfSource =
    scope.kind === "shared" && scope.linkToken && pageData
      ? () => api.myContent.getPdfUrl(pageData.id, scope.linkToken)
      : undefined;
  const guestLocked =
    Boolean(signInGate?.active) ||
    Boolean(pageData?.access && !pageData.access.canAnnotate) ||
    isPreloadedDoc;
  const { gate: annotationGate } = resolveAnnotationLock({
    signInGateActive: Boolean(signInGate?.active),
    canAnnotate: pageData?.access?.canAnnotate,
    isPreloaded: isPreloadedDoc,
  });
  const onGuestLockedClick = signInGate?.active
    ? (feature: string) => signInGate.prompt(feature)
    : annotationGate === "save-to-library"
      ? () => promptPreloadedSave()
      : undefined;

  useEffect(() => {
    if (editing) setHtmlClip(false);
  }, [editing]);

  useEffect(() => {
    const flush = () => {
      if (viewTimer.current) window.clearTimeout(viewTimer.current);
      const pageId = pageIdRef.current;
      if (pageId) flushViewToServer(pageId, viewRef.current);
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
      if (persistTimer.current) window.clearTimeout(persistTimer.current);
      flush();
    };
  }, [flushViewToServer]);

  useEffect(() => {
    onHandlersRef.current({
      startEditing,
      saveEditing,
      flushEditing,
      cancelEditing,
      handleToggleComplete,
      handleToggleStar,
      handleDelete,
      openStudyAI,
      setHtmlClip,
      navHref: (pageSlug: string) => navHref(scope, pageSlug),
      reloadPage,
      toggleFullscreen,
      pdfZoomIn: () => {
        pdfCommandsRef.current?.zoomIn();
        sketchZoomRef.current?.zoomIn();
      },
      pdfZoomOut: () => {
        pdfCommandsRef.current?.zoomOut();
        sketchZoomRef.current?.zoomOut();
      },
      pdfToggleNight: () => pdfCommandsRef.current?.toggleNight(),
      pdfNextPage: () => pdfCommandsRef.current?.nextPage(),
      pdfPrevPage: () => pdfCommandsRef.current?.prevPage(),
      capturePdfPage: () => {
        const pdf = pdfCommandsRef.current?.captureVisiblePage() ?? "";
        if (pdf) return pdf;
        const host = shellRef.current;
        return host ? captureVisibleSketchPage(host) : "";
      },
      scrollToHighlight,
    });
  }, [
    focused,
    startEditing,
    saveEditing,
    flushEditing,
    cancelEditing,
    handleToggleComplete,
    handleToggleStar,
    handleDelete,
    openStudyAI,
    scrollToHighlight,
    scope,
    reloadPage,
    toggleFullscreen,
  ]);

  useEffect(() => {
    onSnapshotRef.current({
      paneId,
      tabKey: tab.key,
      pageData,
      loading,
      editing,
      liveEdit:
        Boolean(
          pageData &&
            !pageData.isPreloaded &&
            ((pageData.contentType === "HTML" &&
              editing &&
              isLiveEditorHtml(
                draftContentRef.current || editorSeed || pageData.content
              )) ||
              pageData.contentType === "VIDEO")
        ),
      saving,
      htmlClip,
      scope,
      currentHref,
      scrollContainer: scrollEl,
      contentRoot,
      pdfPage: pdfInfo?.page ?? null,
      pdfNumPages: pdfInfo?.numPages ?? null,
      readPercent: liveReadPercent,
      highlights,
      highlightsHydrating,
    });
  }, [
    focused,
    paneId,
    tab.key,
    pageData,
    loading,
    editing,
    editorSeed,
    saving,
    htmlClip,
    scope,
    currentHref,
    scrollEl,
    contentRoot,
    pdfInfo,
    liveReadPercent,
    highlights,
    highlightsHydrating,
  ]);

  const isPdf = pageData?.contentType === "PDF";
  const isLink = pageData?.contentType === "LINK";
  const isVideo = pageData?.contentType === "VIDEO";
  const linkEmbedAllowed =
    isLink &&
    shouldUseLinkEmbed({
      sourceUrl: pageData?.sourceUrl,
      embeddable: pageData?.embeddable,
      linkStatus: pageData?.linkStatus,
    });
  const linkEmbedHintValue =
    isLink &&
    linkEmbedHint({
      sourceUrl: pageData?.sourceUrl,
      embeddable: pageData?.embeddable,
      linkStatus: pageData?.linkStatus,
    });
  const learnEmbedStatusProbe =
    scope.kind === "learn" && isPreloadedDoc && isLink
      ? () =>
          api.subjects
            .getArticleEmbedStatus(
              scope.subjectSlug,
              scope.topicSlug,
              scope.articleSlug
            )
            .then((r) => ({
              embeddable: r.embeddable,
              linkStatus: r.linkStatus,
            }))
      : undefined;
  const liveBlank =
    Boolean(
      pageData &&
        !pageData.isPreloaded &&
        pageData.contentType === "HTML" &&
        editing &&
        isLiveEditorHtml(
          draftContentRef.current || editorSeed || pageData.content
        )
    );

  const crumbNotebook =
    pageData?.notebookMeta ??
    (notebook
      ? { name: notebook.name, slug: notebook.slug, icon: notebook.icon }
      : null);
  const crumbTopic = pageData?.topicMeta ?? null;

  return (
    <div
      ref={shellRef}
      className={clsx(
        "flex-1 flex flex-col overflow-hidden min-w-0 min-h-0 bg-[var(--bg-primary)]",
        focused ? "" : "opacity-90",
        dropActive ? "ring-2 ring-inset ring-[var(--accent)]" : ""
      )}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes(SHELF_PAGE_MIME)) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          setDropActive(true);
        }
      }}
      onDragLeave={() => setDropActive(false)}
      onDrop={(e) => {
        setDropActive(false);
        const raw = e.dataTransfer.getData(SHELF_PAGE_MIME);
        if (!raw) return;
        e.preventDefault();
        try {
          const payload = JSON.parse(raw) as {
            href: string;
            title: string;
            pageId: string;
            scope: PersonalPageReaderScope;
          };
          onDropPage({
            key: payload.href,
            href: payload.href,
            title: payload.title,
            scope: payload.scope,
            pageId: payload.pageId,
          });
        } catch {
          /* ignore */
        }
      }}
      data-pane-id={paneId}
    >
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <CircleLoader size="lg" label="Loading page" />
        </div>
      ) : pageData?.accessDenied ? (
        <AccessDeniedState />
      ) : pageData ? (
        <>
          {showChrome && (
            <div
              className={`doc-chrome-bar grid items-center gap-3 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-primary)] shrink-0 ${
                editing || liveBlank
                  ? "grid-cols-[minmax(0,1fr)_auto]"
                  : "grid-cols-[minmax(0,1fr)_minmax(6.5rem,11rem)_minmax(0,1fr)]"
              }`}
            >
              <nav className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] min-w-0">
                <Link
                  href="/my-content"
                  onClick={(e) => {
                    // Already in the reader for the focused tab — don't bounce via
                    // /my-content (that remounts the workspace).
                    if (shouldSkipLibraryNav(getLibraryHref())) {
                      e.preventDefault();
                    }
                  }}
                  className="hover:text-[var(--text-primary)] shrink-0"
                >
                  {pageData.access && !pageData.access.isOwner
                    ? "Shared with me"
                    : "Library"}
                </Link>
                {crumbNotebook ? (
                  <>
                    <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />
                    <span className="truncate" title={crumbNotebook.name}>
                      {crumbNotebook.name}
                    </span>
                  </>
                ) : null}
                {crumbNotebook && crumbTopic ? (
                  <>
                    <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />
                    <span className="truncate" title={crumbTopic.title}>
                      {crumbTopic.title}
                    </span>
                  </>
                ) : null}
                <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />
                {isPreloadedDoc || isSharedRecipient ? (
                  <span
                    className="truncate text-[11px] text-[var(--text-secondary)]"
                    title={pageData.title}
                  >
                    {pageData.title}
                  </span>
                ) : (
                  <RenameButton
                    label={pageData.title}
                    textClassName="text-[11px] text-[var(--text-secondary)]"
                    iconClassName="w-3 h-3"
                    className="min-w-0"
                    onRename={async (title) => {
                      await api.myContent.updatePageTitle(pageData.id, title);
                      setPageData({ ...pageData, title });
                      onMeta({ title });
                      onNotebookPatch((prev) =>
                        prev
                          ? syncPageInTree([prev], pageData.id, { title })[0]
                          : prev
                      );
                      emitPageRenamed(pageData.id, title);
                    }}
                  />
                )}
                {liveBlank &&
                (saveStatus === "saving" ||
                  saveStatus === "saved" ||
                  saveStatus === "dirty" ||
                  saveStatus === "error" ||
                  saving) ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-light)] text-[var(--accent)] shrink-0">
                    {saveStatus === "saving" || saving
                      ? "Saving…"
                      : saveStatus === "saved"
                        ? "Saved"
                        : saveStatus === "dirty"
                          ? "Saving…"
                          : "Save failed"}
                  </span>
                ) : editing && !liveBlank ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-light)] text-[var(--accent)] shrink-0">
                    {saveStatus === "saving" || saving
                      ? "Saving…"
                      : saveStatus === "saved"
                        ? "Saved"
                        : saveStatus === "dirty"
                          ? "Editing…"
                          : saveStatus === "error"
                            ? "Save failed"
                            : "Editing"}
                  </span>
                ) : isPdf ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 bg-[rgba(196,160,122,0.18)] text-[#c4a07a]">
                    PDF
                  </span>
                ) : isLink ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 bg-[rgba(110,174,166,0.18)] text-[#6eaea6]">
                    Link
                  </span>
                ) : isVideo ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 bg-[rgba(110,121,214,0.18)] text-[var(--accent)]">
                    YouTube
                  </span>
                ) : isPreloadedDoc ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                    Preloaded
                  </span>
                ) : pageData.access && !pageData.access.isOwner ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-light)] text-[var(--accent)] shrink-0">
                    Shared
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center gap-1 shrink-0">
                    <Lock className="w-3 h-3" />
                    Private
                  </span>
                )}
              </nav>
              {!editing && !liveBlank && (
                <ReadProgressBar
                  percent={liveReadPercent}
                  className="doc-chrome-progress justify-self-center max-w-[11rem] w-full"
                />
              )}
              <DocumentChromeActions
                isFullscreen={isFullscreen}
                fsAiOpen={fsAiOpen}
                onToggleFsAi={() => setFsAiOpen((open) => !open)}
                onToggleFullscreen={() => void toggleFullscreen()}
                showClip={!isPdf && !isPreloadedDoc && !liveBlank}
                htmlClip={htmlClip}
                onToggleClip={() => setHtmlClip((v) => !v)}
                showShare={
                  !isPreloadedDoc &&
                  (!pageData.access || pageData.access.isOwner)
                }
                onShare={() => setShareOpen(true)}
                showStar={!isPreloadedDoc}
                starred={pageData.starred}
                onToggleStar={() => void handleToggleStar()}
                showDelete={
                  !isPreloadedDoc &&
                  (!pageData.access || pageData.access.isOwner)
                }
                onDelete={() => void handleDelete()}
              />
            </div>
          )}

          {isPreloadedDoc && showChrome && scope.kind === "learn" && (
            <PreloadedSaveBanner
              subjectSlug={scope.subjectSlug}
              topicSlug={scope.topicSlug}
              articleSlug={scope.articleSlug}
              pageTitle={pageData.title}
              saveAllowed={pageData.saveAllowed !== false}
              saveReason={pageData.saveReason}
              onOpen={onNavigate}
            />
          )}

          {pageData.access && !pageData.access.isOwner && showChrome && (
            <SharedByBanner
              access={pageData.access}
              onSaveCopy={() => {
                void api.myContent
                  .saveSharedCopy(pageData.id, {
                    t: scope.kind === "shared" ? scope.linkToken : undefined,
                  })
                  .then(() => {
                    window.dispatchEvent(new Event("shelf:shares-changed"));
                    window.dispatchEvent(new Event("shelf:content-changed"));
                  })
                  .catch(() => undefined);
              }}
            />
          )}

          <SharePageModal
            open={shareOpen}
            pageId={pageData.id}
            pageTitle={pageData.title}
            onClose={() => {
              setShareOpen(false);
              window.dispatchEvent(new Event("shelf:shares-changed"));
            }}
          />

          <div
            className={`flex-1 flex overflow-hidden min-h-0${
              fsAiResizing ? " select-none cursor-col-resize" : ""
            }`}
          >
            <div className="flex-1 flex min-w-0 min-h-0 overflow-hidden">
              {isPdf ? (
                <PdfViewer
                  userTopicId={pageData.id}
                  getPdfSource={curriculumPdfSource ?? sharedPdfSource}
                  canEditPdf={
                    !curriculumPdfSource &&
                    !guestLocked &&
                    !isPreloadedDoc &&
                    (!pageData.access || pageData.access.isOwner)
                  }
                  fileName={pageData.title}
                  highlights={highlights}
                  onHighlightsChange={setHighlights}
                  highlightsHydrating={highlightsHydrating}
                  guestLocked={guestLocked}
                  onGuestLockedClick={onGuestLockedClick}
                  annotationGate={annotationGate}
                  onAskSelection={(text, image, attach) =>
                    openStudyAI(text, image, attach)
                  }
                  onClip={(data) => onClipImage(data, pageData)}
                  initialView={savedView}
                  onViewStateChange={persistView}
                  commandsRef={pdfCommandsRef}
                  onPageInfo={setPdfInfo}
                  onReadProgress={handleReadProgress}
                  phoneChrome={
                    isPhone && showChrome
                      ? {
                          starred: pageData.starred,
                          onToggleStar: isPreloadedDoc
                            ? undefined
                            : () => void handleToggleStar(),
                          onShare:
                            !isPreloadedDoc &&
                            (!pageData.access || pageData.access.isOwner)
                              ? () => setShareOpen(true)
                              : undefined,
                          onDelete:
                            !isPreloadedDoc &&
                            (!pageData.access || pageData.access.isOwner)
                              ? () => void handleDelete()
                              : undefined,
                        }
                      : undefined
                  }
                />
              ) : isLink ? (
                <EmbedViewer
                  pageId={isPreloadedDoc ? "" : pageData.id}
                  title={pageData.title}
                  url={pageData.sourceUrl ?? ""}
                  embeddableHint={linkEmbedHintValue}
                  linkStatus={pageData.linkStatus}
                  embedStatusProbe={learnEmbedStatusProbe}
                  editing={editing}
                  draftTitle={draftTitle}
                  draftUrl={draftUrl}
                  onDraftTitleChange={setDraftTitle}
                  onDraftUrlChange={setDraftUrl}
                  clipMode={htmlClip}
                  onClip={(data) => {
                    onClipImage(data, pageData);
                    setHtmlClip(false);
                  }}
                  onImport={
                    !isPreloadedDoc && linkEmbedAllowed ? importLinkPage : undefined
                  }
                />
              ) : isVideo ? (
                <VideoPageView
                  pageId={pageData.id}
                  title={pageData.title}
                  sourceUrl={pageData.sourceUrl ?? ""}
                  notesHtml={pageData.content}
                  initialSeconds={savedView?.scrollTop ?? 0}
                  highlights={highlights}
                  onHighlightsChange={setHighlights}
                  guestLocked={guestLocked}
                  onGuestLockedClick={onGuestLockedClick}
                  onAskSelection={(text, image, attach) =>
                    openStudyAI(text, image, attach)
                  }
                  clipMode={htmlClip}
                  onClip={(data) => {
                    onClipImage(data, pageData);
                    setHtmlClip(false);
                  }}
                  onViewStateChange={persistView}
                  onReadProgress={handleReadProgress}
                />
              ) : (
                <>
                <PersonalContentArea
                  content={
                    editing && editorSeed
                      ? editorSeed
                      : editing
                        ? draftContent
                        : pageData.content
                  }
                  userTopicId={pageData.id}
                  highlights={highlights}
                  onHighlightsChange={setHighlights}
                  guestLocked={guestLocked}
                  onGuestLockedClick={onGuestLockedClick}
                  onAskSelection={(text, _image, attach) =>
                    openStudyAI(text, undefined, attach)
                  }
                  editing={!isPreloadedDoc && editing}
                  onContentChange={(html) => {
                    draftContentRef.current = html;
                    if (editorSeed) {
                      // Live sketch/doc: keep props stable so contentEditable keeps focus.
                      scheduleLiveAutosave();
                      return;
                    }
                    setDraftContent(html);
                    scheduleLiveAutosave();
                  }}
                  clipMode={htmlClip}
                  onClip={(data) => {
                    onClipImage(data, pageData);
                    setHtmlClip(false);
                  }}
                  onReadProgress={handleReadProgress}
                  onScrollContainer={setScrollEl}
                  onContentRoot={setContentRoot}
                  initialScrollTop={savedView?.scrollTop}
                  initialScrollLeft={savedView?.scrollLeft}
                  initialScale={savedView?.scale}
                  zoomCommandsRef={sketchZoomRef}
                  onViewStateChange={persistView}
                />
                {pageData.isLocked && (
                  <PaywallBanner previewPercent={30} />
                )}
                </>
              )}
            </div>

            {isFullscreen && fsAiOpen && (
              <>
                <div
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize Study AI"
                  title="Drag to resize Study AI"
                  className={`w-1 shrink-0 cursor-col-resize bg-[var(--border)] hover:bg-[var(--accent)]/40 active:bg-[var(--accent)]/50 touch-none ${
                    fsAiResizing ? "bg-[var(--accent)]/50" : ""
                  }`}
                  onPointerDown={onFsAiResizePointerDown}
                />
                <aside
                  className="shrink-0 h-full flex flex-col border-l border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden"
                  style={{ width: fsAiWidth }}
                  aria-label="Study AI"
                >
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
                        {isLink
                          ? "Ask about this linked page"
                          : isVideo
                            ? "Ask about this lecture and notes"
                            : fsSelection
                              ? "Ask about the highlight"
                              : "Ask about this file"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href="/study-ai"
                      className="text-[11px] text-[var(--accent)] hover:underline px-1"
                    >
                      All chats
                    </Link>
                    <button
                      type="button"
                      onClick={() => setFsAiOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                      title="Hide Study AI"
                      aria-label="Hide Study AI"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-4 py-3">
                  <StudyPanel
                    userTopicId={pageData.id}
                    selection={fsSelection}
                    imageBase64={fsImage}
                    getPageImage={() => {
                      const pdf =
                        pdfCommandsRef.current?.captureVisiblePage() ?? "";
                      if (pdf) return pdf;
                      const host = shellRef.current;
                      return host ? captureVisibleSketchPage(host) : "";
                    }}
                    onClearSelection={() => {
                      setFsSelection(null);
                      setFsImage(undefined);
                      fsAttachNoteRef.current = undefined;
                    }}
                    onAttachNote={(note) => fsAttachNoteRef.current?.(note)}
                    embedMode={isLink}
                  />
                </div>
              </aside>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
          Page not found
        </div>
      )}
    </div>
  );
}
