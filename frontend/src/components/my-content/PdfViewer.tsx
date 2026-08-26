"use client";

import { useEffect, useRef, useState, useCallback, type MutableRefObject } from "react";
import * as pdfjs from "pdfjs-dist";
import { api } from "@/lib/api";
import {
  createHighlight,
  deleteHighlight,
  updateHighlight,
} from "@/lib/offline/highlights";
import { canvasToJpegDataUrl } from "@/lib/pdfPageImage";
import { UserContentHighlight } from "@/types";
import { HighlightToolbar } from "../HighlightToolbar";
import { HighlightNoteModal } from "../HighlightNoteModal";
import { Columns2, Crop, Download, Eraser, File, Highlighter, Loader2, Moon, MousePointer2, MousePointerClick, PenLine, Settings2, Sun, Undo2, ZoomIn, ZoomOut } from "lucide-react";
import { DEFAULT_PEN_WIDTH, DEFAULT_INK_WIDTH, INK_WIDTHS, PEN_WIDTHS, penCursorPx, penHitWidthPx, penStrokeWidthPx, straightenStroke } from "@/lib/straightenStroke";
import { polylineHitsPoint, rectHitsPoint } from "@/lib/eraseHit";
import {
  fitPdfSheetScale,
  pdfFitPageSize,
  pdfPageCssSize,
  pdfPageRows,
  readPdfPageLayout,
  writePdfPageLayout,
  type PdfPageLayout,
} from "@/lib/pdfLayout";
import { PenSettingsPanel } from "./PenSettingsPanel";
import { PEN_COLORS } from "./BlankEditorToolbar";
import { PdfPageNav } from "./PdfPageNav";
import { usePdfReadProgressSync } from "./PdfReadProgress";
import { useInkGestures } from "./useInkGestures";
import { useWindowPenStroke } from "./useWindowPenStroke";
import {
  highlightHex,
  isInkHighlight,
  markerRect,
  mergeLineRects,
  penStroke,
  pointsToPath,
} from "./pdfViewerHelpers";
import { getCachedPdf, scheduleFullPdfCache } from "@/lib/pdfByteCache";
import {
  PDF_IO_ROOT_MARGIN,
  pdfInitialProbePages,
  pdfResumePage,
  probePdfPageSize,
} from "@/lib/pdfPageProbe";
import {
  deleteLibraryPdfPages,
  undoLibraryPdfPageDelete,
} from "@/lib/deleteLibraryPdfPages";
import { clearPdfDeleteUndos, countPdfDeleteUndos } from "@/lib/pdfDeleteUndo";
import { withShortcut } from "@/lib/hotkeys";
import { useInkSurface } from "@/hooks/useInkSurface";
import { PenCursor, usePenCursor } from "./PenCursor";
import {
  clearNativeSelection,
  isPrimaryInkPointer,
  shouldPreventInkPointerDown,
} from "@/lib/inkSurface";
import { PdfDeleteUndoBar } from "./PdfDeleteUndoBar";
import { usePdfMarkUndo } from "./usePdfMarkUndo";
import { usePdfWheelZoom } from "./usePdfWheelZoom";
import { useHotkey } from "@/hooks/useHotkeys";
import { clampPdfScale } from "@/lib/pdfZoom";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

export type PdfViewState = {
  pdfPage?: number;
  /** 0–1 offset within pdfPage */
  pageOffset?: number;
  scrollTop?: number;
  scale?: number;
  /** Invert white pages for night reading */
  darkPdf?: boolean;
};

export type PdfViewerCommands = {
  zoomIn: () => void;
  zoomOut: () => void;
  toggleNight: () => void;
  nextPage: () => void;
  prevPage: () => void;
  /** JPEG of the on-screen PDF page for Study AI when the file has no text. */
  captureVisiblePage: () => string;
};

interface PdfViewerProps {
  userTopicId: string;
  /** Curriculum (or other) source — default is the user's library PDF. */
  getPdfSource?: () => Promise<{ url: string; version: string }>;
  fileName?: string;
  highlights: UserContentHighlight[];
  onHighlightsChange: (highlights: UserContentHighlight[]) => void;
  onAskSelection?: (
    text: string,
    imageBase64?: string,
    attachNote?: (note: string) => Promise<void>
  ) => void;
  onClip?: (imageDataUrl: string) => void;
  /** Restore after tab remount */
  initialView?: PdfViewState | null;
  onViewStateChange?: (state: PdfViewState) => void;
  commandsRef?: MutableRefObject<PdfViewerCommands | null>;
  onPageInfo?: (info: { page: number; numPages: number }) => void;
  onReadProgress?: (percent: number) => void;
  /** Account-only annotate tools — visible but muted for guests. */
  guestLocked?: boolean;
  onGuestLockedClick?: (feature: string) => void;
}

type ToolMode = "text" | "pen" | "ink" | "clip" | "erase";
type EraseKind = "stroke" | "object";

const PDF_ERASER_RADIUS = 0.022;
const DEFAULT_INK_COLOR =
  PEN_COLORS.find((c) => c.id === "black")?.color ?? "#1f2937";

type ToolbarState = {
  text: string;
  rect: DOMRect;
  kind: "TEXT" | "REGION";
  pageNumber: number;
  position: UserContentHighlight["position"];
  imageBase64?: string;
};

export function PdfViewer({
  userTopicId,
  getPdfSource,
  fileName,
  highlights,
  onHighlightsChange,
  onAskSelection,
  onClip,
  initialView,
  onViewStateChange,
  commandsRef,
  onPageInfo,
  onReadProgress,
  guestLocked = false,
  onGuestLockedClick,
}: PdfViewerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const bindScrollRef = useCallback((el: HTMLDivElement | null) => {
    scrollRef.current = el;
    setScrollRoot(el);
  }, []);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const renderTasks = useRef<
    Map<number, { cancel: () => void; promise: Promise<unknown> }>
  >(new Map());
  /** Serialize renders per page so two callers never hit the same canvas. */
  const renderQueue = useRef(new Map<number, Promise<void>>());
  /** Skip re-paint when IntersectionObserver fires again at the same zoom. */
  const paintedAtScale = useRef(new Map<number, number>());
  const probedPagesRef = useRef(new Set<number>());
  const initialViewRef = useRef(initialView);
  initialViewRef.current = initialView;
  const onViewStateChangeRef = useRef(onViewStateChange);
  onViewStateChangeRef.current = onViewStateChange;
  const onPageInfoRef = useRef(onPageInfo);
  onPageInfoRef.current = onPageInfo;
  const onReadProgressRef = useRef(onReadProgress);
  onReadProgressRef.current = onReadProgress;
  const blocked = useCallback(
    (feature: string) => {
      if (!guestLocked) return false;
      onGuestLockedClick?.(feature);
      return true;
    },
    [guestLocked, onGuestLockedClick]
  );
  const lockedTool = guestLocked
    ? "opacity-45 cursor-not-allowed saturate-[0.85]"
    : "";
  const currentPageRef = useRef(initialView?.pdfPage ?? 1);
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialView?.pdfPage ?? 1);
  const [viewRestored, setViewRestored] = useState(false);
  const [scale, setScale] = useState(initialView?.scale ?? 1);
  const [darkPdf, setDarkPdf] = useState(() => {
    if (initialView?.darkPdf != null) return initialView.darkPdf;
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("shelf:pdf-night-mode") === "1";
    } catch {
      return false;
    }
  });
  const [pageSize, setPageSize] = useState({ w: 720, h: 1020 });
  const [pageSizes, setPageSizes] = useState<Record<number, { w: number; h: number }>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [deletingPages, setDeletingPages] = useState(false);
  const [undoCount, setUndoCount] = useState(0);
  const [undoing, setUndoing] = useState(false);
  const [mode, setMode] = useState<ToolMode>("text");
  const [eraseKind, setEraseKind] = useState<EraseKind>("stroke");
  const cursorTool =
    mode === "pen" || mode === "ink" || (mode === "erase" && eraseKind === "stroke");
  const inkActive = cursorTool || mode === "clip";
  const inkActiveRef = useRef(inkActive);
  inkActiveRef.current = inkActive;
  useInkSurface(scrollRef, inkActive);
  const setInkDrawing = useInkGestures(scrollRoot, inkActive);
  const [penWidth, setPenWidth] = useState<number>(DEFAULT_PEN_WIDTH);
  const [penOpacity, setPenOpacity] = useState(0.55);
  const [penColorId, setPenColorId] = useState("yellow");
  const [inkColor, setInkColor] = useState(DEFAULT_INK_COLOR);
  const [inkWidth, setInkWidth] = useState<number>(DEFAULT_INK_WIDTH);
  const [pageLayout, setPageLayout] = useState<PdfPageLayout>(readPdfPageLayout);
  const [penSettingsOpen, setPenSettingsOpen] = useState(false);
  const penSettingsBtnRef = useRef<HTMLButtonElement>(null);
  const penCursor = usePenCursor();
  const [toolbar, setToolbar] = useState<ToolbarState | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<{
    highlight: UserContentHighlight;
    rect: DOMRect;
  } | null>(null);
  const [noteTarget, setNoteTarget] = useState<{
    quote: string;
    highlight?: UserContentHighlight;
    draft?: ToolbarState;
  } | null>(null);
  const drawing = useRef(false);
  const erasing = useRef(false);
  const strokePointerId = useRef<number | null>(null);
  const {
    beginStroke,
    endStroke,
    isDrawing: isWindowPenDrawing,
    bindLiveGroup,
    promoteLive,
    clearLive,
  } = useWindowPenStroke();
  const highlightsRef = useRef(highlights);
  highlightsRef.current = highlights;
  const droppedHighlightIds = useRef(new Set<string>());
  const eraseSessionRef = useRef<UserContentHighlight[]>([]);
  const {
    canUndo: canUndoMark,
    pushAdd: pushMarkAdd,
    pushRemove: pushMarkRemove,
    remapId: remapMarkId,
    clear: clearMarkUndo,
    undo: undoMark,
  } = usePdfMarkUndo(
    userTopicId,
    () => highlightsRef.current,
    (next) => {
      highlightsRef.current = next;
      onHighlightsChange(next);
    }
  );

  useEffect(() => {
    clearMarkUndo();
  }, [userTopicId, reloadToken, clearMarkUndo]);

  useHotkey(
    "mod+z",
    () => {
      if (guestLocked) return;
      void undoMark();
    },
    { enabled: canUndoMark && !guestLocked, allowWhenSuppressed: true }
  );
  const strokeRef = useRef<{
    page: number;
    points: Array<{ x: number; y: number }>;
  } | null>(null);
  const clipRef = useRef<{
    page: number;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  } | null>(null);
  const [clipBox, setClipBox] = useState<{
    page: number;
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const draftPathRefs = useRef<Map<number, SVGPathElement>>(new Map());
  const draftFrameRef = useRef<number | null>(null);
  const sourceUrlRef = useRef<string | null>(null);
  const getPdfSourceRef = useRef(getPdfSource);
  getPdfSourceRef.current = getPdfSource;

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  const syncPageFromScroll = useCallback(() => {
    const root = scrollRef.current;
    if (!root || numPages <= 0) return;
    const anchor = root.scrollTop + 24;
    let next = 1;
    for (let i = 1; i <= numPages; i++) {
      const el = pageRefs.current.get(i);
      if (!el) continue;
      if (el.offsetTop <= anchor + 1) next = i;
      else break;
    }
    if (next !== currentPageRef.current) {
      currentPageRef.current = next;
    }
  }, [numPages]);

  const flushPageUi = useCallback(() => {
    const page = currentPageRef.current;
    setCurrentPage((prev) => (prev === page ? prev : page));
    if (numPages) {
      onPageInfoRef.current?.({ page, numPages });
    }
  }, [numPages]);

  useEffect(() => {
    let cancelled = false;
    let loaded: pdfjs.PDFDocumentProxy | null = null;
    let cancelCacheFill: (() => void) | undefined;
    probedPagesRef.current.clear();
    setViewRestored(false);
    setLoading(true);
    setError("");
    setPdfDoc(null);
    setNumPages(0);
    setPageSizes({});

    (async () => {
      try {
        const source = getPdfSourceRef.current
          ? await getPdfSourceRef.current()
          : await api.myContent.getPdfUrl(userTopicId);
        if (cancelled) return;
        sourceUrlRef.current = source.url;
        const version = source.version;
        const cached = await getCachedPdf(userTopicId, version);
        if (cancelled) return;

        if (cached) {
          loaded = await pdfjs.getDocument({
            data: cached.slice(0),
            isEvalSupported: true,
            isOffscreenCanvasSupported: true,
          }).promise;
        } else {
          // Range-request streaming: PDF.js fetches byte chunks from S3.
          loaded = await pdfjs.getDocument({
            url: source.url,
            withCredentials: false,
            rangeChunkSize: 65536 * 2,
            disableAutoFetch: true,
            disableStream: false,
            isEvalSupported: true,
            isOffscreenCanvasSupported: true,
          }).promise;
          cancelCacheFill = scheduleFullPdfCache(
            userTopicId,
            version,
            source.url
          );
        }

        if (cancelled) {
          loaded.destroy();
          return;
        }
        const startPage = pdfResumePage(
          initialViewRef.current?.pdfPage,
          loaded.numPages
        );
        const sizes: Record<number, { w: number; h: number }> = {};
        let resumePage: pdfjs.PDFPageProxy | null = null;
        for (const pageNum of pdfInitialProbePages(startPage, loaded.numPages)) {
          if (cancelled) {
            loaded.destroy();
            return;
          }
          try {
            const page = await loaded.getPage(pageNum);
            if (pageNum === startPage) resumePage = page;
            const viewport = page.getViewport({ scale: 1 });
            sizes[pageNum] = { w: viewport.width, h: viewport.height };
            probedPagesRef.current.add(pageNum);
          } catch {
            sizes[pageNum] = { w: 720, h: 1020 };
          }
        }
        const primary = sizes[startPage] ?? { w: 720, h: 1020 };
        setPageSize(primary);
        setPageSizes(sizes);
        setPdfDoc(loaded);
        setNumPages(loaded.numPages);
        setLoading(false);
        try {
          const page = resumePage ?? (await loaded.getPage(startPage));
          const text = await page.getTextContent();
          const chars = text.items
            .map((item) => ("str" in item ? item.str : ""))
            .join("")
            .trim();
          if (!cancelled && chars.length < 40) setMode("pen");
        } catch {
          if (!cancelled) setMode("pen");
        }
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Could not load PDF");
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      cancelCacheFill?.();
      loaded?.destroy();
    };
  }, [userTopicId, reloadToken]);

  /** Restore scroll / page once the page placeholders are laid out. */
  useEffect(() => {
    if (!pdfDoc || numPages === 0 || viewRestored) return;
    const root = scrollRef.current;
    if (!root) return;
    const page = Math.min(
      Math.max(1, currentPageRef.current || initialView?.pdfPage || 1),
      numPages
    );
    const scrollTop = initialView?.scrollTop;
    const pageOffset = initialView?.pageOffset;
    const savedScale = initialView?.scale;
    const sameScale =
      savedScale == null || Math.abs(savedScale - scale) < 0.02;
    const sameSavedPage = page === (initialView?.pdfPage ?? 1);

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 45;

    const apply = () => {
      if (cancelled) return;
      attempts += 1;

      if (savedScale == null) {
        const fit = pdfFitPageSize(pageSizes, pageSize);
        if (
          fit.w > 0 &&
          root.clientWidth > 0 &&
          root.clientHeight > 0
        ) {
          const fitScale = fitPdfSheetScale({
            layout: pageLayout,
            containerW: root.clientWidth,
            containerH: root.clientHeight,
            pageW: fit.w,
            pageH: fit.h,
          });
          if (Math.abs(fitScale - scale) >= 0.02) {
            setScale(fitScale);
            return;
          }
        } else if (attempts < MAX_ATTEMPTS) {
          requestAnimationFrame(apply);
          return;
        }
      }

      const el = pageRefs.current.get(page);
      const laidOut =
        page <= 1 ||
        (el != null && root.contains(el) && el.offsetHeight > 8);

      if (laidOut && el) {
        if (
          sameSavedPage &&
          typeof pageOffset === "number" &&
          Number.isFinite(pageOffset) &&
          pageOffset >= 0
        ) {
          root.scrollTop = Math.max(
            0,
            el.offsetTop + Math.min(1, pageOffset) * el.offsetHeight
          );
        } else if (
          sameSavedPage &&
          sameScale &&
          typeof scrollTop === "number" &&
          scrollTop > 0
        ) {
          root.scrollTop = scrollTop;
        } else if (page > 1) {
          root.scrollTop = Math.max(0, el.offsetTop - 8);
        }
        currentPageRef.current = page;
        setCurrentPage(page);
        setViewRestored(true);
        return;
      }

      if (attempts >= MAX_ATTEMPTS) {
        currentPageRef.current = page;
        setCurrentPage(page);
        setViewRestored(true);
        return;
      }
      requestAnimationFrame(apply);
    };

    const id = requestAnimationFrame(apply);
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [
    pdfDoc,
    numPages,
    scale,
    viewRestored,
    initialView?.pdfPage,
    initialView?.scrollTop,
    initialView?.pageOffset,
    initialView?.scale,
    pageLayout,
    pageSize,
    pageSizes,
  ]);

  /** Persist view state while reading — only after restore so we don't save page 1. */
  useEffect(() => {
    if (!pdfDoc || !viewRestored || !onViewStateChangeRef.current) return;
    const root = scrollRef.current;
    if (!root) return;
    let timer: number | null = null;
    let pageUiTimer: number | null = null;
    const emit = () => {
      const page = currentPageRef.current;
      const el = pageRefs.current.get(page);
      const pageOffset =
        el && el.offsetHeight > 0
          ? Math.max(
              0,
              Math.min(1, (root.scrollTop - el.offsetTop) / el.offsetHeight)
            )
          : 0;
      onViewStateChangeRef.current?.({
        pdfPage: page,
        pageOffset,
        scrollTop: root.scrollTop,
        scale,
        darkPdf,
      });
    };
    const onScroll = () => {
      syncPageFromScroll();
      if (pageUiTimer) window.clearTimeout(pageUiTimer);
      pageUiTimer = window.setTimeout(flushPageUi, 100);
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(emit, 200);
    };
    /** Stop overscroll from chaining into the parent and yanking the view up. */
    const onWheel = (e: WheelEvent) => {
      if (root.dataset.inkDrawing === "1") {
        e.preventDefault();
        return;
      }
      /** Pinch / Ctrl+wheel zoom is handled by usePdfWheelZoom. */
      if (e.ctrlKey || e.metaKey) return;
      const max = root.scrollHeight - root.clientHeight;
      if (max <= 0) {
        e.preventDefault();
        return;
      }
      const atBottom = root.scrollTop >= max - 1;
      const atTop = root.scrollTop <= 0;
      if ((atBottom && e.deltaY > 0) || (atTop && e.deltaY < 0)) {
        e.preventDefault();
      }
    };
    /** While a pen/ink stroke is active, block touch pans from moving the page. */
    const onTouchMove = (e: TouchEvent) => {
      if (root.dataset.inkDrawing === "1" && e.cancelable) {
        e.preventDefault();
      }
    };
    /**
     * Only cancel *touch* defaults while drawing. preventDefault on pen
     * pointerdown makes Chrome on Android (S Pen) fire pointercancel and
     * kill the stroke — touch-action: none already blocks pan for stylus.
     */
    const onPointerDownCapture = (e: PointerEvent) => {
      if (!inkActiveRef.current) return;
      if (e.pointerType === "pen" || e.pointerType === "mouse") return;
      const target = e.target;
      if (!(target instanceof Element) || !target.closest(".pdf-page-wrap")) return;
      if (!isPrimaryInkPointer(e)) return;
      if (e.cancelable) e.preventDefault();
    };
    const onPointerMoveCapture = (e: PointerEvent) => {
      if (e.pointerType === "pen" || e.pointerType === "mouse") return;
      if (root.dataset.inkDrawing === "1" && e.cancelable) {
        e.preventDefault();
      }
    };
    const onHide = () => emit();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") emit();
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    root.addEventListener("wheel", onWheel, { passive: false });
    root.addEventListener("touchmove", onTouchMove, { passive: false });
    root.addEventListener("pointerdown", onPointerDownCapture, {
      capture: true,
      passive: false,
    });
    root.addEventListener("pointermove", onPointerMoveCapture, {
      capture: true,
      passive: false,
    });
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    syncPageFromScroll();
    flushPageUi();
    emit();
    return () => {
      root.removeEventListener("scroll", onScroll);
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("touchmove", onTouchMove);
      root.removeEventListener("pointerdown", onPointerDownCapture, true);
      root.removeEventListener("pointermove", onPointerMoveCapture, true);
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onVisibility);
      if (timer) window.clearTimeout(timer);
      if (pageUiTimer) window.clearTimeout(pageUiTimer);
      emit();
    };
  }, [pdfDoc, viewRestored, scale, darkPdf, syncPageFromScroll, flushPageUi]);

  const toggleDarkPdf = useCallback(() => {
    setDarkPdf((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("shelf:pdf-night-mode", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      onViewStateChangeRef.current?.({ darkPdf: next });
      return next;
    });
  }, []);

  usePdfWheelZoom(scrollRoot, scale, setScale);

  const zoomBy = useCallback((delta: number) => {
    setScale((s) => clampPdfScale(s + delta));
  }, []);

  const fitToSheet = useCallback(
    (layout: PdfPageLayout) => {
      const root = scrollRef.current;
      const fit = pdfFitPageSize(pageSizes, pageSize);
      if (!root || fit.w <= 0) return;
      setScale(
        fitPdfSheetScale({
          layout,
          containerW: root.clientWidth,
          containerH: root.clientHeight,
          pageW: fit.w,
          pageH: fit.h,
        })
      );
    },
    [pageSize, pageSizes]
  );

  const setSheetLayout = useCallback(
    (layout: PdfPageLayout) => {
      setPageLayout(layout);
      writePdfPageLayout(layout);
      fitToSheet(layout);
    },
    [fitToSheet]
  );

  const scrollToPdfPage = useCallback((page: number) => {
    const root = scrollRef.current;
    const max = numPages || 1;
    const next = Math.min(max, Math.max(1, page));
    const el = pageRefs.current.get(next);
    if (root && el) {
      root.scrollTop = Math.max(0, el.offsetTop - 8);
    }
    currentPageRef.current = next;
    setCurrentPage(next);
  }, [numPages]);

  const canDeletePages = !getPdfSource && !guestLocked;

  useEffect(() => {
    if (!canDeletePages) {
      setUndoCount(0);
      return;
    }
    let cancelled = false;
    void countPdfDeleteUndos(userTopicId).then((n) => {
      if (!cancelled) setUndoCount(n);
    });
    return () => {
      cancelled = true;
    };
  }, [canDeletePages, userTopicId, reloadToken]);

  const handleDeletePages = useCallback(
    async (pages: number[]) => {
      if (!canDeletePages || !numPages) return;
      setDeletingPages(true);
      try {
        const { highlights: next, undoCount: n } = await deleteLibraryPdfPages({
          pageId: userTopicId,
          deletedPages: pages,
          numPagesBefore: numPages,
          highlightsBefore: highlights,
          viewPdfPage: currentPageRef.current,
        });
        onHighlightsChange(next);
        setUndoCount(n);
        const keepBefore = Math.min(
          currentPageRef.current,
          Math.max(1, numPages - pages.length)
        );
        currentPageRef.current = keepBefore;
        setCurrentPage(keepBefore);
        setReloadToken((t) => t + 1);
      } finally {
        setDeletingPages(false);
      }
    },
    [
      canDeletePages,
      highlights,
      numPages,
      onHighlightsChange,
      userTopicId,
    ]
  );

  const handleUndoDelete = useCallback(async () => {
    if (!canDeletePages || undoing) return;
    setUndoing(true);
    try {
      const restored = await undoLibraryPdfPageDelete({ pageId: userTopicId });
      if (!restored) {
        setUndoCount(0);
        return;
      }
      onHighlightsChange(restored.highlights);
      setUndoCount(restored.undoCount);
      currentPageRef.current = restored.viewPdfPage;
      setCurrentPage(restored.viewPdfPage);
      setReloadToken((t) => t + 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not undo");
    } finally {
      setUndoing(false);
    }
  }, [canDeletePages, onHighlightsChange, undoing, userTopicId]);

  const layoutForScrollRef = useRef(pageLayout);
  useEffect(() => {
    if (!viewRestored || !numPages) return;
    if (layoutForScrollRef.current === pageLayout) return;
    layoutForScrollRef.current = pageLayout;
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled) return;
        scrollToPdfPage(currentPageRef.current);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [pageLayout, numPages, scrollToPdfPage, viewRestored]);

  useEffect(() => {
    if (!commandsRef) return;
    commandsRef.current = {
      zoomIn: () => zoomBy(0.15),
      zoomOut: () => zoomBy(-0.15),
      toggleNight: toggleDarkPdf,
      nextPage: () => {
        const cur = currentPageRef.current;
        if (pageLayout === "spread") {
          const rowStart = cur % 2 === 0 ? cur - 1 : cur;
          scrollToPdfPage(rowStart + 2);
          return;
        }
        scrollToPdfPage(cur + 1);
      },
      prevPage: () => {
        const cur = currentPageRef.current;
        if (pageLayout === "spread") {
          const rowStart = cur % 2 === 0 ? cur - 1 : cur;
          scrollToPdfPage(rowStart - 2);
          return;
        }
        scrollToPdfPage(cur - 1);
      },
      captureVisiblePage: () => {
        const canvas = canvasRefs.current.get(currentPageRef.current);
        return canvas ? canvasToJpegDataUrl(canvas) : "";
      },
    };
    return () => {
      commandsRef.current = null;
    };
  }, [commandsRef, zoomBy, scrollToPdfPage, toggleDarkPdf, pageLayout]);

  usePdfReadProgressSync(
    scrollRoot,
    !loading && !error && Boolean(pdfDoc) && viewRestored && numPages > 0,
    (percent) => onReadProgressRef.current?.(percent)
  );

  const probePageSizeOnly = useCallback(
    async (pageNum: number) => {
      if (!pdfDoc || probedPagesRef.current.has(pageNum)) return;
      probedPagesRef.current.add(pageNum);
      try {
        const size = await probePdfPageSize(pdfDoc, pageNum);
        setPageSizes((prev) =>
          prev[pageNum] ? prev : { ...prev, [pageNum]: size }
        );
      } catch {
        probedPagesRef.current.delete(pageNum);
      }
    },
    [pdfDoc]
  );

  const renderPage = useCallback(
    (pageNum: number) => {
      if (!pdfDoc) return Promise.resolve();

      const prevChain = renderQueue.current.get(pageNum) ?? Promise.resolve();
      const next = prevChain
        .catch(() => undefined)
        .then(async () => {
          if (!pdfDoc) return;
          if (paintedAtScale.current.get(pageNum) === scale) return;

          const canvas = canvasRefs.current.get(pageNum);
          const wrap = pageRefs.current.get(pageNum);
          if (!canvas || !wrap) return;

          const existing = renderTasks.current.get(pageNum);
          if (existing) {
            existing.cancel();
            await existing.promise.catch(() => undefined);
            if (renderTasks.current.get(pageNum) === existing) {
              renderTasks.current.delete(pageNum);
            }
          }

          if (paintedAtScale.current.get(pageNum) === scale) return;

          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale });
          const outputScale = Math.min(2, window.devicePixelRatio || 1);
          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
          wrap.style.width = `${viewport.width}px`;
          wrap.style.height = `${viewport.height}px`;
          const baseW = viewport.width / scale;
          const baseH = viewport.height / scale;
          setPageSizes((prev) => {
            const cur = prev[pageNum];
            if (
              cur &&
              Math.abs(cur.w - baseW) < 0.5 &&
              Math.abs(cur.h - baseH) < 0.5
            ) {
              return prev;
            }
            return { ...prev, [pageNum]: { w: baseW, h: baseH } };
          });

          const ctx = canvas.getContext("2d", { alpha: false });
          if (!ctx) return;

          const leftover = renderTasks.current.get(pageNum);
          if (leftover) {
            leftover.cancel();
            await leftover.promise.catch(() => undefined);
            renderTasks.current.delete(pageNum);
          }

          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const transform =
            outputScale !== 1
              ? [outputScale, 0, 0, outputScale, 0, 0]
              : undefined;
          const task = page.render({
            canvasContext: ctx,
            viewport,
            transform,
            background: "#ffffff",
          });
          renderTasks.current.set(pageNum, task);
          try {
            await task.promise;
          } catch (err) {
            const name =
              err && typeof err === "object" && "name" in err
                ? String(err.name)
                : "";
            const msg = err instanceof Error ? err.message : String(err ?? "");
            if (
              name === "RenderingCancelledException" ||
              name === "AbortException" ||
              /same canvas during multiple render/i.test(msg) ||
              /RenderingCancelled/i.test(msg)
            ) {
              return;
            }
            console.error("PDF page render failed", pageNum, err);
            return;
          } finally {
            if (renderTasks.current.get(pageNum) === task) {
              renderTasks.current.delete(pageNum);
            }
          }

          paintedAtScale.current.set(pageNum, scale);

          const textLayer = wrap.querySelector(
            ".pdf-text-layer"
          ) as HTMLDivElement | null;
          if (!textLayer) return;
          textLayer.innerHTML = "";
          textLayer.style.width = `${viewport.width}px`;
          textLayer.style.height = `${viewport.height}px`;
          textLayer.style.setProperty("--scale-factor", String(viewport.scale));
          try {
            const textContent = await page.getTextContent();
            const layer = new pdfjs.TextLayer({
              textContentSource: textContent,
              container: textLayer,
              viewport,
            });
            await layer.render();
          } catch {
            /* scanned pages often have no usable text layer */
          }
        });

      renderQueue.current.set(pageNum, next);
      return next;
    },
    [pdfDoc, scale]
  );

  useEffect(() => {
    if (!pdfDoc || numPages === 0) return;

    const painted = paintedAtScale.current;
    painted.clear();
    const tasks = renderTasks.current;
    const startPage = pdfResumePage(initialView?.pdfPage, numPages);
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const n = Number((entry.target as HTMLElement).dataset.page);
          if (n) {
            void probePageSizeOnly(n);
            void renderPage(n);
          }
        }
      },
      {
        root: scrollRef.current,
        rootMargin: PDF_IO_ROOT_MARGIN,
        threshold: 0.01,
      }
    );

    const id = requestAnimationFrame(() => {
      for (let i = 1; i <= numPages; i++) {
        const el = pageRefs.current.get(i);
        if (el) io.observe(el);
      }
      void probePageSizeOnly(startPage);
      if (startPage > 1) void probePageSizeOnly(startPage - 1);
      if (startPage < numPages) void probePageSizeOnly(startPage + 1);
      void renderPage(startPage);
      if (startPage > 1) void renderPage(startPage - 1);
      if (startPage < numPages) void renderPage(startPage + 1);
    });

    return () => {
      cancelAnimationFrame(id);
      io.disconnect();
      tasks.forEach((task) => task.cancel());
      tasks.clear();
      painted.clear();
    };
  }, [
    pdfDoc,
    numPages,
    scale,
    renderPage,
    probePageSizeOnly,
    initialView?.pdfPage,
    pageLayout,
  ]);

  const downloadPdf = async () => {
    const hrefUrl = sourceUrlRef.current;
    const blob = hrefUrl
      ? await fetch(hrefUrl).then((r) => {
          if (!r.ok) throw new Error("Could not download PDF");
          return r.blob();
        })
      : await api.myContent.getPdfBlob(userTopicId);
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const base = (fileName || "document").replace(/[<>:"/\\|?*]+/g, "").trim();
    a.href = href;
    a.download = base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;
    a.click();
    URL.revokeObjectURL(href);
  };

  const localPoint = (pageNum: number, e: React.PointerEvent) => {
    const wrap = pageRefs.current.get(pageNum);
    if (!wrap) return null;
    const rect = wrap.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
      rect,
    };
  };

  const cropStroke = (
    pageNum: number,
    points: Array<{ x: number; y: number }>
  ) => {
    const canvas = canvasRefs.current.get(pageNum);
    const wrap = pageRefs.current.get(pageNum);
    if (!canvas || !wrap || points.length < 2) return "";
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const pad = 0.02;
    const x0 = Math.max(0, Math.min(...xs) - pad);
    const y0 = Math.max(0, Math.min(...ys) - pad);
    const x1 = Math.min(1, Math.max(...xs) + pad);
    const y1 = Math.min(1, Math.max(...ys) + pad);
    const sx = x0 * canvas.width;
    const sy = y0 * canvas.height;
    const sw = Math.max(8, (x1 - x0) * canvas.width);
    const sh = Math.max(8, (y1 - y0) * canvas.height);
    const crop = document.createElement("canvas");
    crop.width = Math.round(sw);
    crop.height = Math.round(sh);
    const ctx = crop.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, crop.width, crop.height);
    return crop.toDataURL("image/png");
  };

  const handleTextMouseUp = (pageNum: number) => {
    if (mode !== "text") return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const text = sel.toString().trim();
    if (text.length < 2) return;
    const wrap = pageRefs.current.get(pageNum);
    if (!wrap) return;
    const range = sel.getRangeAt(0);
    const wrapRect = wrap.getBoundingClientRect();
    const rects = mergeLineRects(
      Array.from(range.getClientRects())
        .filter((r) => r.width > 1 && r.height > 1)
        .map((r) => ({
          x: (r.left - wrapRect.left) / wrapRect.width,
          y: (r.top - wrapRect.top) / wrapRect.height,
          w: r.width / wrapRect.width,
          h: r.height / wrapRect.height,
        }))
    ).map(markerRect);
    if (!rects.length) return;
    setToolbar({
      kind: "TEXT",
      text,
      rect: range.getBoundingClientRect(),
      pageNumber: pageNum,
      position: { rects },
    });
  };

  const commitHighlights = (next: UserContentHighlight[]) => {
    highlightsRef.current = next;
    onHighlightsChange(next);
  };

  const removeHighlight = (id: string) => {
    if (blocked("Highlight and annotate")) return;
    const removed = highlightsRef.current.find((h) => h.id === id);
    if (removed) pushMarkRemove([removed]);
    commitHighlights(highlightsRef.current.filter((h) => h.id !== id));
    setActiveHighlight(null);
    if (id.startsWith("tmp-")) {
      droppedHighlightIds.current.add(id);
      return;
    }
    void deleteHighlight(id, userTopicId).catch(() => undefined);
  };

  const onHighlightActivate = (
    h: UserContentHighlight,
    clientX?: number,
    clientY?: number
  ) => {
    if (mode === "erase") {
      if (eraseKind === "stroke") return;
      removeHighlight(h.id);
      return;
    }
    const rect = new DOMRect(
      (clientX ?? 0) - 4,
      (clientY ?? 40) - 4,
      8,
      8
    );
    setToolbar(null);
    setNoteTarget(null);
    setActiveHighlight({ highlight: h, rect });
  };

  const persistHighlight = (
    color: string,
    note?: string,
    from?: ToolbarState
  ) => {
    if (blocked("Highlight and annotate")) return;
    const source = from ?? toolbar;
    if (!source) return;
    const tempId = `tmp-${crypto.randomUUID()}`;
    const optimistic: UserContentHighlight = {
      id: tempId,
      userTopicId,
      text: source.text,
      startOffset: 0,
      endOffset: 0,
      color,
      note: note ?? null,
      kind: source.kind,
      pageNumber: source.pageNumber,
      position: source.position ?? null,
    };
    commitHighlights([...highlightsRef.current, optimistic]);
    pushMarkAdd(tempId);
    if (!drawing.current) paintDraft(source.pageNumber, []);
    setToolbar(null);
    if (!drawing.current) strokeRef.current = null;
    window.getSelection()?.removeAllRanges();
    void createHighlight({
      userTopicId,
      text: source.text,
      color,
      note,
      kind: source.kind,
      pageNumber: source.pageNumber,
      position: source.position ?? undefined,
    })
      .then((highlight) => {
        if (droppedHighlightIds.current.has(tempId)) {
          droppedHighlightIds.current.delete(tempId);
          void deleteHighlight(highlight.id, userTopicId).catch(() => undefined);
          return;
        }
        remapMarkId(tempId, highlight.id);
        commitHighlights(
          highlightsRef.current.map((h) => (h.id === tempId ? highlight : h))
        );
      })
      .catch(() => {
        commitHighlights(
          highlightsRef.current.filter((h) => h.id !== tempId)
        );
      });
    return optimistic;
  };

  const handleHighlight = (color: string) => {
    persistHighlight(color);
  };

  const highlighterDraftPoints = (
    points: Array<{ x: number; y: number }>
  ) => (mode === "ink" || points.length < 2 ? points : straightenStroke(points));

  const appendStrokePoint = (
    stroke: { points: Array<{ x: number; y: number }> },
    pt: { x: number; y: number }
  ) => {
    const last = stroke.points[stroke.points.length - 1];
    const dx = pt.x - last.x;
    const dy = pt.y - last.y;
    // ~0.2% of the page: drops duplicate samples without rounding off handwriting.
    if (dx * dx + dy * dy < 0.000004) return;
    stroke.points.push({ x: pt.x, y: pt.y });
  };

  const paintDraft = (page: number, points: Array<{ x: number; y: number }>) => {
    if (draftFrameRef.current !== null) {
      cancelAnimationFrame(draftFrameRef.current);
      draftFrameRef.current = null;
    }
    const path = draftPathRefs.current.get(page);
    if (!path) return;
    path.setAttribute("d", pointsToPath(highlighterDraftPoints(points)));
    const ink = mode === "ink";
    path.setAttribute(
      "stroke",
      ink ? inkColor : penStroke(penColorId, penOpacity)
    );
    path.setAttribute(
      "stroke-width",
      String(penStrokeWidthPx(ink ? inkWidth : penWidth))
    );
    path.classList.toggle("pdf-ink-stroke", ink);
    path.classList.toggle("pdf-pen-stroke", !ink);
  };

  /**
   * Redraw at most once per frame. Points are collected at the stylus' full
   * rate; rebuilding the path that often is what makes a long stroke lag
   * behind the nib.
   */
  const schedulePaintDraft = (page: number) => {
    if (draftFrameRef.current !== null) return;
    draftFrameRef.current = requestAnimationFrame(() => {
      draftFrameRef.current = null;
      const stroke = strokeRef.current;
      if (stroke && stroke.page === page) paintDraft(page, stroke.points);
    });
  };

  const cropRect = (
    pageNum: number,
    box: { x: number; y: number; w: number; h: number }
  ) => {
    const canvas = canvasRefs.current.get(pageNum);
    if (!canvas) return "";
    const sx = box.x * canvas.width;
    const sy = box.y * canvas.height;
    const sw = Math.max(8, box.w * canvas.width);
    const sh = Math.max(8, box.h * canvas.height);
    const crop = document.createElement("canvas");
    crop.width = Math.round(sw);
    crop.height = Math.round(sh);
    const ctx = crop.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, crop.width, crop.height);
    return crop.toDataURL("image/png");
  };

  const onClipDown = (pageNum: number, e: React.PointerEvent) => {
    if (mode !== "clip" || !isPrimaryInkPointer(e)) return;
    const pt = localPoint(pageNum, e);
    if (!pt) return;
    e.preventDefault();
    clearNativeSelection();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setInkDrawing(true);
    clipRef.current = { page: pageNum, x0: pt.x, y0: pt.y, x1: pt.x, y1: pt.y };
    setClipBox({ page: pageNum, x: pt.x, y: pt.y, w: 0, h: 0 });
  };

  const onClipMove = (pageNum: number, e: React.PointerEvent) => {
    const clip = clipRef.current;
    if (!clip || clip.page !== pageNum || mode !== "clip") return;
    e.preventDefault();
    const pt = localPoint(pageNum, e);
    if (!pt) return;
    clip.x1 = pt.x;
    clip.y1 = pt.y;
    const x = Math.min(clip.x0, clip.x1);
    const y = Math.min(clip.y0, clip.y1);
    setClipBox({
      page: pageNum,
      x,
      y,
      w: Math.abs(clip.x1 - clip.x0),
      h: Math.abs(clip.y1 - clip.y0),
    });
  };

  const onClipUp = (pageNum: number, e: React.PointerEvent) => {
    const clip = clipRef.current;
    clipRef.current = null;
    setInkDrawing(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    if (!clip || clip.page !== pageNum) return;
    const box = {
      x: Math.min(clip.x0, clip.x1),
      y: Math.min(clip.y0, clip.y1),
      w: Math.abs(clip.x1 - clip.x0),
      h: Math.abs(clip.y1 - clip.y0),
    };
    setClipBox(null);
    if (box.w < 0.02 || box.h < 0.02) return;
    const data = cropRect(pageNum, box);
    if (data && onClip) onClip(data);
  };

  const highlightHitsEraser = (
    h: UserContentHighlight,
    pageNum: number,
    pt: { x: number; y: number }
  ) => {
    if (h.pageNumber !== pageNum) return false;
    if (h.position?.type === "pen" && h.position.points?.length) {
      const pad = (h.position.width ?? DEFAULT_PEN_WIDTH) * 4;
      return polylineHitsPoint(h.position.points, pt, PDF_ERASER_RADIUS + pad);
    }
    for (const r of h.position?.rects ?? []) {
      if (rectHitsPoint(r, pt, PDF_ERASER_RADIUS)) return true;
    }
    return false;
  };

  const eraseAt = (pageNum: number, pt: { x: number; y: number }) => {
    const hits = highlightsRef.current.filter((h) =>
      highlightHitsEraser(h, pageNum, pt)
    );
    if (!hits.length) return;
    const seen = new Set(eraseSessionRef.current.map((h) => h.id));
    for (const h of hits) {
      if (!seen.has(h.id)) {
        eraseSessionRef.current.push(h);
        seen.add(h.id);
      }
    }
    const drop = new Set(hits.map((h) => h.id));
    commitHighlights(highlightsRef.current.filter((h) => !drop.has(h.id)));
    setActiveHighlight(null);
    for (const h of hits) {
      if (h.id.startsWith("tmp-")) {
        droppedHighlightIds.current.add(h.id);
        continue;
      }
      void deleteHighlight(h.id, userTopicId).catch(() => undefined);
    }
  };

  const onEraseDown = (pageNum: number, e: React.PointerEvent) => {
    if (mode !== "erase" || eraseKind !== "stroke" || !isPrimaryInkPointer(e))
      return;
    const pt = localPoint(pageNum, e);
    if (!pt) return;
    e.preventDefault();
    clearNativeSelection();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setInkDrawing(true);
    erasing.current = true;
    setActiveHighlight(null);
    setToolbar(null);
    eraseAt(pageNum, pt);
  };

  const onEraseMove = (pageNum: number, e: React.PointerEvent) => {
    if (!erasing.current || mode !== "erase" || eraseKind !== "stroke") return;
    e.preventDefault();
    const pt = localPoint(pageNum, e);
    if (!pt) return;
    eraseAt(pageNum, pt);
  };

  const onEraseUp = (_pageNum: number, e: React.PointerEvent) => {
    if (!erasing.current) return;
    erasing.current = false;
    setInkDrawing(false);
    if (eraseSessionRef.current.length) {
      pushMarkRemove(eraseSessionRef.current);
      eraseSessionRef.current = [];
    }
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  /**
   * A stroke belongs to the pointer that started it. Without this a palm
   * touching down and lifting again ends the stylus stroke still in progress.
   */
  const ownsStroke = (e: React.PointerEvent) =>
    strokePointerId.current === null || strokePointerId.current === e.pointerId;

  const strokeInProgress = () =>
    drawing.current ||
    isWindowPenDrawing() ||
    erasing.current ||
    clipRef.current !== null;

  const onPointerDown = (pageNum: number, e: React.PointerEvent) => {
    if (mode === "pen" || mode === "ink") {
      onPenDown(pageNum, e);
      return;
    }
    if (strokePointerId.current !== null) {
      if (strokeInProgress()) {
        if (strokePointerId.current !== e.pointerId) return;
      } else {
        strokePointerId.current = null;
      }
    }
    if (mode === "clip") onClipDown(pageNum, e);
    else if (mode === "erase") onEraseDown(pageNum, e);
    if (strokeInProgress()) strokePointerId.current = e.pointerId;
  };
  const onPointerMove = (pageNum: number, e: React.PointerEvent) => {
    // Pen/ink moves are handled on window while the stroke is active.
    if (mode === "pen" || mode === "ink") return;
    if (!ownsStroke(e)) return;
    if (mode === "clip") onClipMove(pageNum, e);
    else if (mode === "erase") onEraseMove(pageNum, e);
  };
  const onPointerUp = (pageNum: number, e: React.PointerEvent) => {
    if (mode === "pen" || mode === "ink") return;
    if (!ownsStroke(e)) return;
    strokePointerId.current = null;
    if (mode === "clip") onClipUp(pageNum, e);
    else if (mode === "erase") onEraseUp(pageNum, e);
  };

  const resetStroke = (pageNum: number) => {
    setInkDrawing(false);
    strokePointerId.current = null;
    drawing.current = false;
    if (isWindowPenDrawing()) endStroke();
    if (erasing.current && eraseSessionRef.current.length) {
      pushMarkRemove(eraseSessionRef.current);
      eraseSessionRef.current = [];
    }
    erasing.current = false;
    clipRef.current = null;
    strokeRef.current = null;
    setClipBox(null);
    paintDraft(pageNum, []);
  };

  const onPointerCancel = (pageNum: number, e: React.PointerEvent) => {
    if (mode === "pen" || mode === "ink") return;
    if (!ownsStroke(e)) return;
    if (!strokeInProgress()) return;
    resetStroke(pageNum);
  };

  const onPenDown = (pageNum: number, e: React.PointerEvent) => {
    if (mode !== "pen" && mode !== "ink") return;
    if (!isPrimaryInkPointer(e)) return;
    const pt = localPoint(pageNum, e);
    if (!pt) return;
    // Android S Pen: skip. iPad Pencil: cancel Copy / Translate / Share.
    if (shouldPreventInkPointerDown(e)) e.preventDefault();
    clearNativeSelection();
    setInkDrawing(true);
    drawing.current = true;
    const ink = mode === "ink";
    const colorId = penColorId;
    const width = ink ? inkWidth : penWidth;
    const opacity = ink ? 1 : penOpacity;
    const color = ink ? inkColor : penStroke(penColorId, penOpacity);

    beginStroke({
      pointerId: e.pointerId,
      page: pageNum,
      start: { x: pt.x, y: pt.y },
      localize: (clientX, clientY) => {
        const el = pageRefs.current.get(pageNum);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          x: (clientX - rect.left) / rect.width,
          y: (clientY - rect.top) / rect.height,
        };
      },
      paint: (pts) => paintDraft(pageNum, pts),
      finish: (pts) => {
        drawing.current = false;
        setInkDrawing(false);
        if (pts.length < 2) {
          paintDraft(pageNum, []);
          return;
        }
        const points = ink ? pts : straightenStroke(pts);
        // Keep ink on screen now; React/API save runs after the tip-up.
        const bridge = promoteLive(pageNum, pointsToPath(points), {
          stroke: color,
          strokeWidth: penStrokeWidthPx(width),
          className: ink ? "pdf-ink-stroke" : "pdf-pen-stroke",
        });
        paintDraft(pageNum, []);
        queueMicrotask(() => {
          persistHighlight(ink ? inkColor : colorId, undefined, {
            kind: "REGION",
            text: ink ? "Ink stroke" : "Highlighted region",
            rect: new DOMRect(0, 0, 0, 0),
            pageNumber: pageNum,
            position: {
              type: "pen",
              tool: ink ? "ink" : "highlight",
              points,
              width,
              opacity,
              color: ink ? inkColor : undefined,
            },
          });
          requestAnimationFrame(() => {
            requestAnimationFrame(() => clearLive(pageNum, bridge));
          });
        });
      },
    });
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-red-400 px-6">
        {error}
      </div>
    );
  }

  if (loading || !pdfDoc) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading PDF…
      </div>
    );
  }

  const penHighlights = (pageNum: number) =>
    highlights.filter(
      (h) =>
        h.pageNumber === pageNum &&
        h.position?.type === "pen" &&
        (h.position.points?.length ?? 0) > 1
    );

  const rectHighlights = (pageNum: number) =>
    highlights.filter(
      (h) =>
        h.pageNumber === pageNum &&
        h.position?.type !== "pen" &&
        (h.position?.rects?.length ?? 0) > 0
    );

  return (
    <div
      ref={rootRef}
      data-shelf-hotkeys={mode === "text" ? undefined : "off"}
      className={`flex-1 flex flex-col overflow-hidden bg-[var(--bg-secondary)] [:fullscreen]:bg-[var(--bg-primary)]${darkPdf ? " pdf-viewer-dark" : ""}`}
    >
      <div className="shrink-0 border-b border-[var(--border)] bg-[var(--bg-primary)]">
        <div className="flex items-center justify-center gap-0.5 px-4 py-2 overflow-x-auto scrollbar-none">
          <PdfPageNav
            compact
            currentPage={currentPage}
            numPages={numPages}
            pdfDoc={pdfDoc}
            canDeletePages={canDeletePages}
            deletingPages={deletingPages}
            onGoToPage={scrollToPdfPage}
            onDeletePages={handleDeletePages}
          />
          <div className="w-px h-5 bg-[var(--border)] mx-1 shrink-0" />
          <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)]"
            title="Download PDF"
            aria-label="Download PDF"
            onClick={() => void downloadPdf()}
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            className={`p-2 rounded-lg ${mode === "text" ? "bg-[var(--accent-light)] text-[var(--accent)]" : "hover:bg-[var(--bg-secondary)]"}`}
            onClick={() => {
              setMode("text");
              setPenSettingsOpen(false);
              penCursor.hide();
            }}
            title={
              guestLocked
                ? "Sign in to highlight or ask Study AI"
                : "Select text to highlight or ask Study AI"
            }
            aria-label="Select text"
          >
            <MousePointer2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            className={`p-2 rounded-lg ${mode === "pen" ? "bg-[var(--accent-light)] text-[var(--accent)]" : "hover:bg-[var(--bg-secondary)]"} ${lockedTool}`}
            onClick={() => {
              if (blocked("Highlight and annotate")) return;
              setMode("pen");
              setPenSettingsOpen(true);
            }}
            title={
              guestLocked
                ? "Sign in to highlight with pen"
                : "Draw highlighter strokes on the page"
            }
            aria-label="Highlighter"
            aria-disabled={guestLocked}
          >
            <Highlighter className="w-4 h-4" />
          </button>
          {mode === "pen" && (
            <>
              <div className="flex items-center gap-0.5 ml-0.5">
                {PEN_WIDTHS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`min-w-[1.5rem] h-7 px-1 rounded-md text-[10px] font-semibold tabular-nums ${
                      Math.abs(penWidth - s.width) < 0.00015
                        ? "bg-[var(--accent)] text-white"
                        : "hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                    }`}
                    title={s.title}
                    aria-label={s.title}
                    onClick={() => setPenWidth(s.width)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <button
                ref={penSettingsBtnRef}
                type="button"
                className={`p-2 rounded-lg ${penSettingsOpen ? "bg-[var(--accent-light)] text-[var(--accent)]" : "hover:bg-[var(--bg-secondary)]"}`}
                onClick={() => setPenSettingsOpen((v) => !v)}
                title="Thickness and opacity"
                aria-label="Highlighter settings"
                aria-pressed={penSettingsOpen}
              >
            <Settings2 className="w-4 h-4" />
          </button>
            </>
          )}
          <button
            type="button"
            className={`p-2 rounded-lg ${mode === "ink" ? "bg-[var(--accent-light)] text-[var(--accent)]" : "hover:bg-[var(--bg-secondary)]"} ${lockedTool}`}
            onClick={() => {
              if (blocked("Highlight and annotate")) return;
              setMode("ink");
              setPenSettingsOpen(false);
            }}
            title={
              guestLocked
                ? "Sign in to write on the page"
                : "Pen — underline or write on the page"
            }
            aria-label="Pen"
            aria-disabled={guestLocked}
          >
            <PenLine className="w-4 h-4" />
          </button>
          {mode === "ink" && (
            <>
              <div className="flex items-center gap-0.5 ml-0.5">
                {INK_WIDTHS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`min-w-[1.5rem] h-7 px-1 rounded-md text-[10px] font-semibold tabular-nums ${
                      Math.abs(inkWidth - s.width) < 0.00015
                        ? "bg-[var(--accent)] text-white"
                        : "hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                    }`}
                    title={s.title}
                    aria-label={`Pen ${s.title}`}
                    onClick={() => setInkWidth(s.width)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {PEN_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`w-4 h-4 rounded-full border-2 hover:scale-110 transition-transform ${
                    inkColor === c.color
                      ? "border-[var(--accent)] scale-110"
                      : c.id === "white"
                        ? "border-[var(--border)]"
                        : "border-transparent"
                  }`}
                  style={{ background: c.color }}
                  title={c.label}
                  aria-label={`Pen ${c.label}`}
                  aria-pressed={inkColor === c.color}
                  onClick={() => setInkColor(c.color)}
                />
              ))}
            </>
          )}
          <button
            type="button"
            className={`p-2 rounded-lg ${mode === "erase" ? "bg-[var(--accent-light)] text-[var(--accent)]" : "hover:bg-[var(--bg-secondary)]"} ${lockedTool}`}
            onClick={() => {
              if (blocked("Highlight and annotate")) return;
              setMode("erase");
              setPenSettingsOpen(false);
              penCursor.hide();
            }}
            title={
              guestLocked
                ? "Sign in to erase highlights"
                : "Eraser"
            }
            aria-label="Eraser"
            aria-disabled={guestLocked}
          >
            <Eraser className="w-4 h-4" />
          </button>
          {mode === "erase" && (
            <div className="flex items-center gap-0.5 ml-0.5">
              <button
                type="button"
                className={`inline-flex items-center gap-1 h-7 px-1.5 rounded-md text-[10px] font-semibold ${
                  eraseKind === "stroke"
                    ? "bg-[var(--accent)] text-white"
                    : "hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                }`}
                title="Stroke eraser — drag over ink"
                aria-pressed={eraseKind === "stroke"}
                onClick={() => setEraseKind("stroke")}
              >
                <Eraser className="w-3 h-3" />
                Stroke
              </button>
              <button
                type="button"
                className={`inline-flex items-center gap-1 h-7 px-1.5 rounded-md text-[10px] font-semibold ${
                  eraseKind === "object"
                    ? "bg-[var(--accent)] text-white"
                    : "hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                }`}
                title="Object eraser — click a mark to delete it"
                aria-pressed={eraseKind === "object"}
                onClick={() => setEraseKind("object")}
              >
                <MousePointerClick className="w-3 h-3" />
                Object
              </button>
            </div>
          )}
          {onClip && (
            <button
              type="button"
              className={`p-2 rounded-lg ${mode === "clip" ? "bg-[var(--accent-light)] text-[var(--accent)]" : "hover:bg-[var(--bg-secondary)]"} ${lockedTool}`}
              onClick={() => {
                if (blocked("Save clips")) return;
                setPenSettingsOpen(false);
                penCursor.hide();
                setMode((m) => (m === "clip" ? "text" : "clip"));
              }}
              title={
                guestLocked
                  ? "Sign in to clip regions"
                  : "Clip a region of the page as an image"
              }
              aria-label="Clip region"
              aria-disabled={guestLocked}
            >
              <Crop className="w-4 h-4" />
            </button>
          )}
          <div className="w-px h-5 bg-[var(--border)] mx-1" />
          <button
            type="button"
            className={`p-2 rounded-lg hover:bg-[var(--bg-secondary)] ${lockedTool} disabled:opacity-35 disabled:pointer-events-none`}
            disabled={!canUndoMark || guestLocked}
            onClick={() => {
              if (blocked("Highlight and annotate")) return;
              void undoMark();
            }}
            title={
              guestLocked
                ? "Sign in to undo marks"
                : withShortcut("Undo last mark", "mod+z")
            }
            aria-label="Undo last mark"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-[var(--border)] mx-1" />
          <button
            type="button"
            className={`p-2 rounded-lg ${pageLayout === "single" ? "bg-[var(--accent-light)] text-[var(--accent)]" : "hover:bg-[var(--bg-secondary)]"}`}
            onClick={() => setSheetLayout("single")}
            title="A4 sheet — one page"
            aria-label="One page A4 sheet"
            aria-pressed={pageLayout === "single"}
          >
            <File className="w-4 h-4" />
          </button>
          <button
            type="button"
            className={`p-2 rounded-lg ${pageLayout === "spread" ? "bg-[var(--accent-light)] text-[var(--accent)]" : "hover:bg-[var(--bg-secondary)]"}`}
            onClick={() => setSheetLayout("spread")}
            title="A4 sheets — two pages side by side"
            aria-label="Two page A4 spread"
            aria-pressed={pageLayout === "spread"}
          >
            <Columns2 className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-[var(--border)] mx-1" />
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)]"
            onClick={() => zoomBy(-0.15)}
            title={withShortcut("Zoom out", "-")}
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span
            className="text-xs w-10 text-center tabular-nums text-[var(--text-secondary)]"
            title={`Zoom ${Math.round(scale * 100)}% · pinch or Ctrl+scroll`}
          >
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)]"
            onClick={() => zoomBy(0.15)}
            title={withShortcut("Zoom in", "=")}
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-[var(--border)] mx-1" />
          <button
            type="button"
            className={`p-2 rounded-lg ${darkPdf ? "bg-[var(--accent-light)] text-[var(--accent)]" : "hover:bg-[var(--bg-secondary)]"}`}
            onClick={toggleDarkPdf}
            title={
              darkPdf
                ? withShortcut("Switch to light PDF pages", "m")
                : withShortcut("Night mode — darken white PDF pages", "m")
            }
            aria-label={darkPdf ? "Disable PDF night mode" : "Enable PDF night mode"}
            aria-pressed={darkPdf}
          >
            {darkPdf ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </div>
        </div>
      </div>

      <div className="relative flex-1 flex flex-col min-h-0">
        {mode === "pen" && penSettingsOpen && (
          <PenSettingsPanel
            width={penWidth}
            opacity={penOpacity}
            colorId={penColorId}
            colorHex={highlightHex(penColorId)}
            anchorEl={penSettingsBtnRef.current}
            onWidthChange={setPenWidth}
            onOpacityChange={setPenOpacity}
            onColorChange={setPenColorId}
            onClose={() => setPenSettingsOpen(false)}
          />
        )}
        {cursorTool && (
          <PenCursor
            handle={penCursor}
            kind={mode === "pen" ? "pen" : mode === "ink" ? "ink" : "erase"}
            size={penCursorPx(mode === "ink" ? inkWidth : penWidth)}
            color={mode === "ink" ? inkColor : penStroke(penColorId, penOpacity)}
          />
        )}
      <div
        ref={bindScrollRef}
        className={`flex-1 overflow-auto px-4 py-6 overscroll-y-contain [overflow-anchor:none]${inkActive ? " shelf-ink-surface" : ""}${cursorTool ? " cursor-none" : ""}`}
        onPointerMove={(e) => {
          if (cursorTool) penCursor.move(e.clientX, e.clientY);
        }}
        onPointerLeave={penCursor.hide}
      >
        <div
          className={`mx-auto max-w-full ${
            pageLayout === "spread"
              ? "flex flex-col items-center gap-5"
              : "space-y-6"
          }`}
        >
          {pdfPageRows(numPages, pageLayout).map((row) => (
            <div
              key={row.join("-")}
              className={
                pageLayout === "spread"
                  ? "pdf-sheet-row flex justify-center items-start gap-3"
                  : "pdf-sheet-row"
              }
            >
              {row.map((pageNum) => (
            <div
              key={pageNum}
              data-page={pageNum}
              ref={(el) => {
                if (el) pageRefs.current.set(pageNum, el);
                else pageRefs.current.delete(pageNum);
              }}
              className={`pdf-page-wrap pdf-a4-sheet relative mx-auto rounded-[2px] border border-[var(--border)] bg-white overflow-hidden${mode === "pen" || mode === "ink" || mode === "clip" ? " pen-mode" : ""}${mode === "ink" ? " ink-mode" : ""}${mode === "clip" ? " clip-mode" : ""}${mode === "erase" ? " erase-mode" : ""}${mode === "erase" && eraseKind === "stroke" ? " erase-stroke-mode" : ""}`}
              style={{
                width: pdfPageCssSize(pageNum, pageSizes, pageSize).w * scale,
                height: pdfPageCssSize(pageNum, pageSizes, pageSize).h * scale,
              }}
              onContextMenu={
                inkActive ? (e) => e.preventDefault() : undefined
              }
              onPointerDown={(e) => onPointerDown(pageNum, e)}
              onPointerMove={(e) => onPointerMove(pageNum, e)}
              onPointerUp={(e) => onPointerUp(pageNum, e)}
              onPointerCancel={(e) => onPointerCancel(pageNum, e)}
            >
              <canvas
                ref={(el) => {
                  if (el) canvasRefs.current.set(pageNum, el);
                  else canvasRefs.current.delete(pageNum);
                }}
                className="block bg-white"
              />
              {clipBox && clipBox.page === pageNum && (
                <div
                  className="absolute border-2 border-[var(--accent)] bg-[var(--accent)]/15 pointer-events-none"
                  style={{
                    left: `${clipBox.x * 100}%`,
                    top: `${clipBox.y * 100}%`,
                    width: `${clipBox.w * 100}%`,
                    height: `${clipBox.h * 100}%`,
                  }}
                />
              )}
              <div
                className="textLayer pdf-text-layer absolute inset-0"
                style={{ pointerEvents: mode === "text" ? "auto" : "none" }}
                onMouseUp={() => handleTextMouseUp(pageNum)}
              />
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{
                  pointerEvents:
                    mode === "pen" ||
                    mode === "ink" ||
                    mode === "clip" ||
                    (mode === "erase" && eraseKind === "stroke")
                      ? "none"
                      : "auto",
                }}
              >
                {penHighlights(pageNum).map((h) => (
                  // Click sits on the group so the painted stroke (which takes
                  // pointer events while erasing) activates too, not just the halo.
                  <g
                    key={h.id}
                    style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      if (mode === "erase" && eraseKind === "stroke") return;
                      e.stopPropagation();
                      onHighlightActivate(h, e.clientX, e.clientY);
                    }}
                  >
                    {/* Invisible fat hit target for easier clicking */}
                    <path
                      d={pointsToPath(h.position!.points!)}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={penHitWidthPx(h.position?.width ?? DEFAULT_PEN_WIDTH)}
                      strokeLinecap="round"
                      vectorEffect="nonScalingStroke"
                      style={{ pointerEvents: "stroke" }}
                    />
                    <path
                      className={`${isInkHighlight(h) ? "pdf-ink-stroke" : "pdf-pen-stroke"}${h.note?.trim() ? " pdf-pen-stroke-note" : ""}`}
                      d={pointsToPath(h.position!.points!)}
                      stroke={
                        isInkHighlight(h)
                          ? h.position?.color || h.color
                          : penStroke(
                              h.color,
                              h.position?.opacity ?? 0.72
                            )
                      }
                      strokeWidth={penStrokeWidthPx(
                        h.position?.width ?? DEFAULT_PEN_WIDTH
                      )}
                      vectorEffect="nonScalingStroke"
                      style={{ pointerEvents: "none" }}
                    />
                  </g>
                ))}
                <g
                  ref={(el) => bindLiveGroup(pageNum, el)}
                  aria-hidden
                />
                <path
                  ref={(el) => {
                    if (el) draftPathRefs.current.set(pageNum, el);
                  }}
                  className={mode === "ink" ? "pdf-ink-stroke" : "pdf-pen-stroke"}
                  stroke={
                    mode === "ink"
                      ? inkColor
                      : penStroke(penColorId, penOpacity)
                  }
                  strokeWidth={penStrokeWidthPx(
                    mode === "ink" ? inkWidth : penWidth
                  )}
                  vectorEffect="nonScalingStroke"
                  style={{ pointerEvents: "none" }}
                />
              </svg>
              {rectHighlights(pageNum).flatMap((h) =>
                (h.position!.rects ?? []).map((r, idx) => {
                  const box = markerRect(r);
                  return (
                    <div
                      key={`${h.id}-${idx}`}
                      role="button"
                      tabIndex={0}
                      title="Click for highlight options"
                      className={`pdf-highlight-overlay highlight-${h.color}${
                        h.note?.trim() ? " has-note" : ""
                      }`}
                      style={{
                        left: `${box.x * 100}%`,
                        top: `${box.y * 100}%`,
                        width: `${box.w * 100}%`,
                        height: `${box.h * 100}%`,
                      }}
                      onClick={(e) => {
                        if (mode === "pen" || mode === "ink" || mode === "clip") return;
                        if (mode === "erase" && eraseKind === "stroke") return;
                        e.stopPropagation();
                        onHighlightActivate(h, e.clientX, e.clientY);
                      }}
                    />
                  );
                })
              )}
              {highlights
                .filter(
                  (h) =>
                    h.pageNumber === pageNum && Boolean(h.note?.trim())
                )
                .map((h) => {
                  const rect = h.position?.rects?.[h.position.rects.length - 1];
                  const pt = h.position?.points?.[h.position.points.length - 1];
                  if (!rect && !pt) return null;
                  const left = rect ? (rect.x + rect.w) * 100 : (pt?.x ?? 0) * 100;
                  const top = (rect?.y ?? pt?.y ?? 0) * 100;
                  return (
                    <button
                      key={`note-${h.id}`}
                      type="button"
                      className="pdf-note-marker"
                      title="Open note"
                      style={{ left: `calc(${left}% - 8px)`, top: `calc(${top}% - 8px)` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (mode === "erase") {
                          onHighlightActivate(h, e.clientX, e.clientY);
                          return;
                        }
                        setActiveHighlight(null);
                        setNoteTarget({ quote: h.text, highlight: h });
                      }}
                    >
                      N
                    </button>
                  );
                })}
            </div>
              ))}
            </div>
          ))}
        </div>
      </div>
        <PdfDeleteUndoBar
          undoCount={undoCount}
          undoing={undoing}
          onUndo={() => void handleUndoDelete()}
          onDismiss={() => {
            setUndoCount(0);
            void clearPdfDeleteUndos(userTopicId);
          }}
        />
      </div>

      {toolbar && (
        <HighlightToolbar
          rect={toolbar.rect}
          locked={guestLocked}
          onLockedClick={onGuestLockedClick}
          onHighlight={handleHighlight}
          onNote={() => {
            setNoteTarget({ quote: toolbar.text, draft: toolbar });
            setToolbar(null);
          }}
          onAsk={
            onAskSelection
              ? () => {
                  const draft = toolbar;
                  onAskSelection(draft.text, draft.imageBase64, async (note) => {
                    await persistHighlight("yellow", note, draft);
                  });
                  paintDraft(draft.pageNumber, []);
                  setToolbar(null);
                }
              : undefined
          }
          onClose={() => {
            if (toolbar) paintDraft(toolbar.pageNumber, []);
            setToolbar(null);
          }}
        />
      )}
      {activeHighlight && (
        <HighlightToolbar
          rect={activeHighlight.rect}
          showColors
          locked={guestLocked}
          onLockedClick={onGuestLockedClick}
          onHighlight={() => {
            removeHighlight(activeHighlight.highlight.id);
          }}
          onNote={() => {
            setNoteTarget({
              quote: activeHighlight.highlight.text,
              highlight: activeHighlight.highlight,
            });
            setActiveHighlight(null);
          }}
          onAsk={
            onAskSelection
              ? () => {
                  onAskSelection(activeHighlight.highlight.text);
                  setActiveHighlight(null);
                }
              : undefined
          }
          onRemove={() => {
            removeHighlight(activeHighlight.highlight.id);
          }}
          onClose={() => setActiveHighlight(null)}
        />
      )}
      {noteTarget && (
        <HighlightNoteModal
          quote={noteTarget.quote}
          initialNote={noteTarget.highlight?.note ?? ""}
          onClose={() => setNoteTarget(null)}
          onSave={async (note) => {
            if (noteTarget.highlight) {
              const highlight = await updateHighlight(
                noteTarget.highlight.id,
                { note },
                userTopicId,
              );
              onHighlightsChange(
                highlights.map((h) =>
                  h.id === highlight.id ? { ...h, ...highlight } : h
                )
              );
              return;
            }
            if (noteTarget.draft) {
              await persistHighlight("yellow", note, noteTarget.draft);
            }
          }}
          onDeleteNote={
            noteTarget.highlight?.note
              ? async () => {
                  const highlight = await updateHighlight(
                    noteTarget.highlight!.id,
                    { note: null },
                    userTopicId,
                  );
                  onHighlightsChange(
                    highlights.map((h) =>
                      h.id === highlight.id ? { ...h, note: null } : h
                    )
                  );
                }
              : undefined
          }
          onRemoveHighlight={
            noteTarget.highlight
              ? () => {
                  removeHighlight(noteTarget.highlight!.id);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
