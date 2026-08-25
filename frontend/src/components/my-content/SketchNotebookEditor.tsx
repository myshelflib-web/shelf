"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BlankPt, BlankStroke } from "@/lib/blankCanvas";
import { canvasBgTone, canvasFgColor, pointsToPath } from "@/lib/blankCanvas";
import { parseSvgPathPoints, polylineHitsPoint } from "@/lib/eraseHit";
import { useInkSurface } from "@/hooks/useInkSurface";
import {
  clearNativeSelection,
  isPrimaryInkPointer,
  shouldPreventInkPointerDown,
} from "@/lib/inkSurface";
import { useInkGestures } from "./useInkGestures";
import { useStrokeDraft } from "./useStrokeDraft";
import { useWindowPenStroke } from "./useWindowPenStroke";
import {
  DEFAULT_PEN_COLOR,
  DEFAULT_PEN_SIZE,
  type DrawTool,
} from "./BlankEditorToolbar";
import { SketchToolbar } from "./SketchToolbar";
import {
  SKETCH_PAGE_H,
  SKETCH_PAGE_W,
  defaultSketchPage,
  parseSketchNotebook,
  serializeSketchNotebook,
  sketchTemplateClass,
  type SketchNotebook,
  type SketchTemplate,
} from "@/lib/sketchNotebook";

interface SketchNotebookEditorProps {
  initialHtml: string;
  onChange: (html: string) => void;
  onViewStateChange?: (state: { scrollTop: number; scrollLeft: number }) => void;
}

export function SketchNotebookEditor({
  initialHtml,
  onChange,
  onViewStateChange,
}: SketchNotebookEditorProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportEl, setViewportEl] = useState<HTMLDivElement | null>(null);
  const bindViewport = useCallback((el: HTMLDivElement | null) => {
    viewportRef.current = el;
    setViewportEl(el);
  }, []);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onViewStateChangeRef = useRef(onViewStateChange);
  onViewStateChangeRef.current = onViewStateChange;

  const initial = useRef(parseSketchNotebook(initialHtml));
  const [notebook, setNotebook] = useState<SketchNotebook>(initial.current);
  const notebookRef = useRef(notebook);
  notebookRef.current = notebook;

  const activePage = notebook.pages[notebook.activeIndex] ?? notebook.pages[0];
  const [paths, setPaths] = useState<BlankStroke[]>(activePage?.paths ?? []);
  const pathsRef = useRef(paths);
  pathsRef.current = paths;

  const [drawTool, setDrawTool] = useState<DrawTool>("pen");
  const [penColor, setPenColor] = useState(DEFAULT_PEN_COLOR);
  const [penSize, setPenSize] = useState(DEFAULT_PEN_SIZE);
  const drawToolRef = useRef(drawTool);
  drawToolRef.current = drawTool;
  const penSizeRef = useRef(penSize);
  penSizeRef.current = penSize;

  const drawing = useRef(false);
  /** A stroke belongs to the pointer that started it, so a palm cannot end it. */
  const strokePointerId = useRef<number | null>(null);
  const strokePts = useRef<BlankPt[]>([]);
  const { draftPathRef, paintDraft } = useStrokeDraft(strokePts);
  const { beginStroke, bindLiveGroup, promoteLive, clearLive } = useWindowPenStroke();
  const undoStack = useRef<BlankStroke[][]>([]);
  const redoStack = useRef<BlankStroke[][]>([]);
  const gestureUndoPushed = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const refreshUndoUi = useCallback(() => {
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(redoStack.current.length > 0);
  }, []);

  const pushUndo = useCallback(() => {
    undoStack.current.push([...pathsRef.current]);
    if (undoStack.current.length > 50) undoStack.current.shift();
    redoStack.current = [];
    refreshUndoUi();
  }, [refreshUndoUi]);

  useInkSurface(viewportRef, true);
  useInkGestures(viewportEl, true);

  const emit = useCallback((next: SketchNotebook) => {
    notebookRef.current = next;
    setNotebook(next);
    onChangeRef.current(serializeSketchNotebook(next));
  }, []);

  const syncActivePaths = useCallback(
    (
      nextPaths: BlankStroke[],
      opts?: {
        recordUndo?: boolean;
      }
    ) => {
      if (opts?.recordUndo !== false) {
        pushUndo();
      }
      const nb = notebookRef.current;
      const idx = nb.activeIndex;
      const pages = nb.pages.map((p, i) =>
        i === idx ? { ...p, paths: nextPaths } : p
      );
      pathsRef.current = nextPaths;
      setPaths(nextPaths);
      emit({ ...nb, pages });
    },
    [emit, pushUndo]
  );

  useEffect(() => {
    undoStack.current = [];
    redoStack.current = [];
    setCanUndo(false);
    setCanRedo(false);
    const page = notebookRef.current.pages[notebookRef.current.activeIndex];
    if (page) {
      pathsRef.current = page.paths;
      setPaths(page.paths);
    }
  }, [notebook.activeIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      if (e.key !== "z" && e.key !== "Z") return;
      e.preventDefault();
      if (e.shiftKey) {
        const next = redoStack.current.pop();
        if (!next) return;
        undoStack.current.push([...pathsRef.current]);
        syncActivePaths(next, { recordUndo: false });
      } else {
        const prev = undoStack.current.pop();
        if (!prev) return;
        redoStack.current.push([...pathsRef.current]);
        syncActivePaths(prev, { recordUndo: false });
      }
      refreshUndoUi();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [refreshUndoUi, syncActivePaths]);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) return;
    redoStack.current.push([...pathsRef.current]);
    syncActivePaths(prev, { recordUndo: false });
    refreshUndoUi();
  }, [refreshUndoUi, syncActivePaths]);

  const redo = useCallback(() => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push([...pathsRef.current]);
    syncActivePaths(next, { recordUndo: false });
    refreshUndoUi();
  }, [refreshUndoUi, syncActivePaths]);

  const localPoint = (clientX: number, clientY: number): BlankPt => {
    const el = surfaceRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  };

  const finishErase = (e: React.PointerEvent) => {
    if (strokePointerId.current !== null && strokePointerId.current !== e.pointerId) {
      return;
    }
    strokePointerId.current = null;
    if (!drawing.current) return;
    drawing.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onDrawDown = (e: React.PointerEvent) => {
    if (!isPrimaryInkPointer(e)) return;
    // Android S Pen: skip. iPad Pencil: cancel Copy / Translate / Share.
    if (shouldPreventInkPointerDown(e)) e.preventDefault();
    clearNativeSelection();
    const tool = drawToolRef.current;
    const pt = localPoint(e.clientX, e.clientY);
    if (tool === "stroke-erase") {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      strokePointerId.current = e.pointerId;
      drawing.current = true;
      gestureUndoPushed.current = false;
      eraseStrokesAt(pt);
      return;
    }
    if (tool === "object-erase") {
      eraseObjectAt(pt);
      return;
    }
    const color = penColor;
    const width = penSize;
    beginStroke({
      pointerId: e.pointerId,
      page: 0,
      start: pt,
      localize: (x, y) => localPoint(x, y),
      paint: (pts) => paintDraft(pts),
      finish: (pts) => {
        if (pts.length < 2) {
          paintDraft(null);
          return;
        }
        const d = pointsToPath(pts);
        const bridge = promoteLive(0, d, {
          stroke: color,
          strokeWidth: width,
          className: "blank-draw-stroke",
        });
        paintDraft(null);
        queueMicrotask(() => {
          syncActivePaths([...pathsRef.current, { d, color, width }]);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => clearLive(0, bridge));
          });
        });
      },
    });
  };

  const onDrawMove = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    if (strokePointerId.current !== e.pointerId) return;
    e.preventDefault();
    if (drawToolRef.current === "stroke-erase") {
      eraseStrokesAt(localPoint(e.clientX, e.clientY));
    }
  };

  const onDrawUp = (e: React.PointerEvent) => {
    finishErase(e);
  };

  const eraseStrokesAt = (pt: BlankPt) => {
    const radius = Math.max(14, penSizeRef.current * 2.4);
    const kept = pathsRef.current.filter((stroke) => {
      const pts = parseSvgPathPoints(stroke.d);
      return !polylineHitsPoint(pts, pt, radius + stroke.width);
    });
    if (kept.length === pathsRef.current.length) return;
    if (!gestureUndoPushed.current) {
      pushUndo();
      gestureUndoPushed.current = true;
    }
    syncActivePaths(kept, { recordUndo: false });
  };

  const eraseObjectAt = (pt: BlankPt) => {
    const strokeHit = pathsRef.current.findIndex((stroke) => {
      const pts = parseSvgPathPoints(stroke.d);
      return polylineHitsPoint(pts, pt, Math.max(16, stroke.width * 3));
    });
    if (strokeHit >= 0) {
      pushUndo();
      syncActivePaths(
        pathsRef.current.filter((_, i) => i !== strokeHit),
        { recordUndo: false }
      );
    }
  };

  const updateActivePageMeta = (patch: {
    bg?: string;
    template?: SketchTemplate;
  }) => {
    const nb = notebookRef.current;
    const idx = nb.activeIndex;
    const pages = nb.pages.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    emit({ ...nb, pages });
  };

  const goPage = (index: number) => {
    const nb = notebookRef.current;
    const next = Math.max(0, Math.min(index, nb.pages.length - 1));
    if (next === nb.activeIndex) return;
    emit({ ...nb, activeIndex: next });
  };

  const addPage = () => {
    const nb = notebookRef.current;
    const cur = nb.pages[nb.activeIndex];
    const newPage = defaultSketchPage(nb.pages.length, {
      bg: cur?.bg,
      template: cur?.template,
    });
    emit({
      activeIndex: nb.pages.length,
      pages: [...nb.pages, newPage],
    });
  };

  const page = activePage;
  const bg = page?.bg ?? "#ffffff";
  const template = page?.template ?? "ruled";

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden bg-[var(--bg-primary)]">
      <SketchToolbar
        drawTool={drawTool}
        onDrawToolChange={setDrawTool}
        penColor={penColor}
        penSize={penSize}
        onPenColorChange={setPenColor}
        onPenSizeChange={setPenSize}
        template={template}
        onTemplateChange={(t) => updateActivePageMeta({ template: t })}
        pageBg={bg}
        onPageBgChange={(c) => updateActivePageMeta({ bg: c })}
        pageIndex={notebook.activeIndex}
        pageCount={notebook.pages.length}
        onPrevPage={() => goPage(notebook.activeIndex - 1)}
        onNextPage={() => goPage(notebook.activeIndex + 1)}
        onAddPage={addPage}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />
      <div
        ref={bindViewport}
        data-shelf-hotkeys="off"
        className="flex-1 overflow-auto sketch-notebook-viewport overscroll-contain shelf-ink-surface"
        onScroll={() => {
          const vp = viewportRef.current;
          if (!vp) return;
          onViewStateChangeRef.current?.({
            scrollTop: vp.scrollTop,
            scrollLeft: vp.scrollLeft,
          });
        }}
      >
        <div className="flex items-start justify-center min-h-full p-6">
          <div
            ref={surfaceRef}
            className={`shelf-sketch-page sketch-page-sheet ${sketchTemplateClass(template)}`}
            data-template={template}
            data-bg={bg}
            data-bg-tone={canvasBgTone(bg)}
            data-w={SKETCH_PAGE_W}
            data-h={SKETCH_PAGE_H}
            style={{
              width: SKETCH_PAGE_W,
              height: SKETCH_PAGE_H,
              backgroundColor: bg,
              color: canvasFgColor(bg),
            }}
            onPointerDown={onDrawDown}
            onPointerMove={onDrawMove}
            onPointerUp={onDrawUp}
            onPointerCancel={onDrawUp}
            onContextMenu={(e) => e.preventDefault()}
          >
            <svg
              className="blank-draw-layer"
              width={SKETCH_PAGE_W}
              height={SKETCH_PAGE_H}
              viewBox={`0 0 ${SKETCH_PAGE_W} ${SKETCH_PAGE_H}`}
            >
              {paths.map((p, i) => (
                <path
                  key={i}
                  className="blank-draw-stroke"
                  d={p.d}
                  fill="none"
                  stroke={p.color}
                  strokeWidth={p.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              <g ref={(el) => bindLiveGroup(0, el)} aria-hidden />
              <path
                ref={draftPathRef}
                className="blank-draw-stroke opacity-80"
                fill="none"
                stroke={penColor}
                strokeWidth={penSize}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
      <p className="shrink-0 text-center text-[11px] text-[var(--text-muted)] py-1.5 border-t border-[var(--border)]">
        Sketch notebook — draw on the page · add pages with + Page · autosaves
      </p>
    </div>
  );
}
