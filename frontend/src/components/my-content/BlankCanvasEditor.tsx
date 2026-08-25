"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  BLANK_TEXT_BOX_W,
  DEFAULT_CANVAS_BG,
  type BlankPt,
  type BlankStroke,
  type BlankTextBox,
  blankUid,
  canvasBgTone,
  canvasFgColor,
  isEmptyBoxHtml,
  parseBlankCanvas,
  pointsToPath,
  serializeBlankCanvas,
} from "@/lib/blankCanvas";
import { useInkSurface } from "@/hooks/useInkSurface";
import {
  clearNativeSelection,
  isPrimaryInkPointer,
  shouldPreventInkPointerDown,
} from "@/lib/inkSurface";
import { useInkGestures } from "./useInkGestures";
import { useStrokeDraft } from "./useStrokeDraft";
import { useWindowPenStroke } from "./useWindowPenStroke";
import { localPointIn, runBlankEditorCommand, seedBlankCanvasView } from "./blankCanvasDom";
import { expandBlankCanvasAround } from "./blankCanvasExpand";
import { eraseBlankObjectAt, eraseBlankStrokesAt } from "./blankCanvasErase";
import type { DrawTool } from "./BlankEditorToolbar";

interface BlankCanvasEditorProps {
  initialHtml: string;
  drawMode: boolean;
  drawTool?: DrawTool;
  penColor: string;
  penSize: number;
  canvasBg?: string;
  onChange: (html: string) => void;
  onCommandReady?: (run: (cmd: string, value?: string) => void) => void;
  onViewStateChange?: (state: { scrollTop: number; scrollLeft: number }) => void;
}
export function BlankCanvasEditor({
  initialHtml,
  drawMode,
  drawTool = "pen",
  penColor,
  penSize,
  canvasBg = DEFAULT_CANVAS_BG,
  onChange,
  onCommandReady,
  onViewStateChange,
}: BlankCanvasEditorProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportEl, setViewportEl] = useState<HTMLDivElement | null>(null);
  const bindViewport = useCallback((el: HTMLDivElement | null) => {
    viewportRef.current = el;
    setViewportEl(el);
  }, []);
  const surfaceRef = useRef<HTMLDivElement>(null);
  useInkSurface(viewportRef, drawMode);
  useInkGestures(viewportEl, drawMode);
  const boxRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const seededBoxes = useRef<Set<string>>(new Set());
  const seededView = useRef(false);
  const drawing = useRef(false);
  /** A stroke belongs to the pointer that started it, so a palm cannot end it. */
  const strokePointerId = useRef<number | null>(null);
  const strokePts = useRef<BlankPt[]>([]);
  const { draftPathRef, paintDraft } = useStrokeDraft(strokePts);
  const { beginStroke, bindLiveGroup, promoteLive, clearLive } = useWindowPenStroke();
  const activeBoxId = useRef<string | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onViewStateChangeRef = useRef(onViewStateChange);
  onViewStateChangeRef.current = onViewStateChange;
  const drawToolRef = useRef(drawTool);
  drawToolRef.current = drawTool;
  const penSizeRef = useRef(penSize);
  penSizeRef.current = penSize;
  const canvasBgRef = useRef(canvasBg);

  const initial = useRef(parseBlankCanvas(initialHtml));
  const [size, setSize] = useState({
    w: initial.current.w,
    h: initial.current.h,
  });
  const [paths, setPaths] = useState<BlankStroke[]>(initial.current.paths);
  const [boxes, setBoxes] = useState<BlankTextBox[]>(initial.current.boxes);
  const [activeId, setActiveId] = useState<string | null>(
    initial.current.boxes[0]?.id ?? null
  );

  const sizeRef = useRef(size);
  const pathsRef = useRef(paths);
  const boxesRef = useRef(boxes);
  sizeRef.current = size;
  pathsRef.current = paths;
  boxesRef.current = boxes;
  activeBoxId.current = activeId;

  const syncBoxesFromDom = useCallback(() => {
    const next = boxesRef.current.map((b) => {
      const el = boxRefs.current.get(b.id);
      if (!el) return b;
      const html = el.innerHTML;
      if (
        isEmptyBoxHtml(html) &&
        !isEmptyBoxHtml(b.html) &&
        document.activeElement !== el
      ) {
        return b;
      }
      return { ...b, html };
    });
    boxesRef.current = next;
    return next;
  }, []);

  const emit = useCallback(() => {
    const synced = syncBoxesFromDom();
    onChangeRef.current(
      serializeBlankCanvas(
        sizeRef.current.w,
        sizeRef.current.h,
        synced,
        pathsRef.current,
        canvasBg
      )
    );
  }, [syncBoxesFromDom, canvasBg]);

  useEffect(() => {
    if (canvasBgRef.current === canvasBg) return;
    canvasBgRef.current = canvasBg;
    emit();
  }, [canvasBg, emit]);

  useEffect(() => {
    if (seededView.current) return;
    seededView.current = true;
    seedBlankCanvasView({
      viewport: viewportRef.current,
      boxes: boxesRef.current,
      paths: pathsRef.current,
      size: sizeRef.current,
      bg: initial.current.bg,
      boxEls: boxRefs.current,
      seededBoxes: seededBoxes.current,
      onViewStateChange: onViewStateChangeRef.current,
    });
  }, []);

  useEffect(() => {
    onCommandReady?.((cmd, value) => {
      const id = activeBoxId.current;
      const el = id ? boxRefs.current.get(id) : null;
      runBlankEditorCommand(cmd, value, el ?? null, emit);
    });
  }, [onCommandReady, emit]);

  const localPoint = (clientX: number, clientY: number): BlankPt =>
    localPointIn(surfaceRef, clientX, clientY);

  const expandAround = (x: number, y: number) => {
    const next = expandBlankCanvasAround(
      x,
      y,
      sizeRef.current,
      pathsRef.current,
      boxesRef.current,
      strokePts.current
    );
    if (!next) return { ox: 0, oy: 0 };
    pathsRef.current = next.paths;
    boxesRef.current = next.boxes;
    strokePts.current = next.strokePts;
    sizeRef.current = next.size;
    setPaths(next.paths);
    setBoxes(next.boxes);
    setSize(next.size);
    const vp = viewportRef.current;
    if (vp && (next.ox || next.oy)) {
      vp.scrollLeft += next.ox;
      vp.scrollTop += next.oy;
    }
    return { ox: next.ox, oy: next.oy };
  };

  const placeTextBox = (clientX: number, clientY: number) => {
    let pt = localPoint(clientX, clientY);
    const shift = expandAround(pt.x, pt.y);
    pt = { x: pt.x + shift.ox, y: pt.y + shift.oy };
    const box: BlankTextBox = {
      id: blankUid(),
      x: Math.max(24, pt.x - 8),
      y: Math.max(24, pt.y - 12),
      w: BLANK_TEXT_BOX_W,
      html: "<p><br></p>",
    };
    const next = [...boxesRef.current, box];
    boxesRef.current = next;
    setBoxes(next);
    setActiveId(box.id);
    requestAnimationFrame(() => {
      const el = boxRefs.current.get(box.id);
      if (el) {
        el.innerHTML = "<p><br></p>";
        seededBoxes.current.add(box.id);
        el.focus();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(true);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      emit();
    });
  };

  const onSurfaceClick = (e: React.MouseEvent) => {
    if (drawMode) return;
    const target = e.target as HTMLElement;
    if (target.closest(".shelf-text-box")) return;
    placeTextBox(e.clientX, e.clientY);
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
    if (!drawMode || !isPrimaryInkPointer(e)) return;
    // Android S Pen: skip. iPad Pencil: cancel Copy / Translate / Share.
    if (shouldPreventInkPointerDown(e)) e.preventDefault();
    clearNativeSelection();
    const tool = drawToolRef.current;
    const pt = localPoint(e.clientX, e.clientY);
    if (tool === "stroke-erase") {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      strokePointerId.current = e.pointerId;
      drawing.current = true;
      eraseStrokesAt(pt);
      return;
    }
    if (tool === "object-erase") {
      eraseObjectAt(pt);
      return;
    }
    let start = pt;
    const shift0 = expandAround(start.x, start.y);
    start = { x: start.x + shift0.ox, y: start.y + shift0.oy };
    const color = penColor;
    const width = penSize;
    beginStroke({
      pointerId: e.pointerId,
      page: 0,
      start,
      localize: (x, y) => {
        const raw = localPoint(x, y);
        const shift = expandAround(raw.x, raw.y);
        return { x: raw.x + shift.ox, y: raw.y + shift.oy };
      },
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
          const next = [...pathsRef.current, { d, color, width }];
          pathsRef.current = next;
          setPaths(next);
          emit();
          requestAnimationFrame(() => {
            requestAnimationFrame(() => clearLive(0, bridge));
          });
        });
      },
    });
  };

  const onDrawMove = (e: React.PointerEvent) => {
    if (!drawing.current || !drawMode) return;
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
    const kept = eraseBlankStrokesAt(
      pathsRef.current,
      pt,
      penSizeRef.current
    );
    if (!kept) return;
    pathsRef.current = kept;
    setPaths(kept);
    emit();
  };

  const eraseObjectAt = (pt: BlankPt) => {
    const result = eraseBlankObjectAt(
      pathsRef.current,
      boxesRef.current,
      pt,
      (id) => boxRefs.current.get(id)?.offsetHeight ?? 48,
      sizeRef.current
    );
    if (!result) return;
    if (result.paths) {
      pathsRef.current = result.paths;
      setPaths(result.paths);
    }
    if (result.boxes) {
      boxesRef.current = result.boxes;
      setBoxes(result.boxes);
      setActiveId(result.activeId ?? null);
    }
    emit();
  };

  return (
    <div
      ref={bindViewport}
      data-shelf-hotkeys={drawMode ? "off" : undefined}
      className={`flex-1 overflow-auto blank-canvas-viewport overscroll-contain${drawMode ? " shelf-ink-surface" : ""}`}
      onScroll={() => {
        const vp = viewportRef.current;
        if (!vp) return;
        onViewStateChangeRef.current?.({
          scrollTop: vp.scrollTop,
          scrollLeft: vp.scrollLeft,
        });
      }}
    >
      <div
        ref={surfaceRef}
        className="shelf-blank-canvas blank-canvas-surface relative"
        data-w={size.w}
        data-h={size.h}
        data-bg={canvasBg}
        data-bg-tone={canvasBgTone(canvasBg)}
        style={{
          width: size.w,
          height: size.h,
          minWidth: size.w,
          minHeight: size.h,
          backgroundColor: canvasBg,
          color: canvasFgColor(canvasBg),
        }}
        onClick={onSurfaceClick}
      >
        <div className="shelf-blank-textboxes absolute inset-0 z-[1]" inert={drawMode || undefined}>
          {boxes.map((b) => (
            <div
              key={b.id}
              ref={(el) => {
                if (el) {
                  boxRefs.current.set(b.id, el);
                  if (!seededBoxes.current.has(b.id)) {
                    el.innerHTML = b.html || "<p><br></p>";
                    seededBoxes.current.add(b.id);
                  }
                } else {
                  boxRefs.current.delete(b.id);
                }
              }}
              data-id={b.id}
              contentEditable={!drawMode}
              suppressContentEditableWarning
              onFocus={() => setActiveId(b.id)}
              onInput={emit}
              onClick={(e) => e.stopPropagation()}
              className={`shelf-text-box absolute outline-none rounded-md px-2 py-1 min-h-[1.75rem] ${
                activeId === b.id && !drawMode
                  ? "ring-1 ring-[var(--accent)]/50 bg-[var(--bg-elevated)]/40"
                  : "hover:ring-1 hover:ring-[var(--border)]"
              }${drawMode ? " pointer-events-none" : ""}`}
              style={{
                left: b.x,
                top: b.y,
                width: b.w,
                fontSize: 14,
                lineHeight: 1.5,
              }}
            />
          ))}
        </div>

        <svg
          className="blank-draw-layer absolute inset-0 pointer-events-none z-[2]"
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
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
            fill="none"
            stroke={penColor}
            strokeWidth={penSize}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {drawMode && (
          <div
            className="absolute inset-0 z-10 shelf-ink-surface"
            style={{
              cursor:
                drawTool === "object-erase"
                  ? "pointer"
                  : drawTool === "stroke-erase"
                    ? "cell"
                    : "crosshair",
              touchAction: "none",
            }}
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={onDrawDown}
            onPointerMove={onDrawMove}
            onPointerUp={onDrawUp}
            onPointerCancel={onDrawUp}
          />
        )}
      </div>
    </div>
  );
}
