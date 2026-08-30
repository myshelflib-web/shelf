"use client";

import { useRef, useState, type MutableRefObject } from "react";
import {
  BlankEditorToolbar,
  DEFAULT_PEN_COLOR,
  DEFAULT_PEN_SIZE,
  type DrawTool,
} from "./BlankEditorToolbar";
import { BlankCanvasEditor } from "./BlankCanvasEditor";
import { SketchNotebookEditor } from "./SketchNotebookEditor";
import { DocEditor } from "./DocEditor";
import { readCanvasBg } from "@/lib/blankCanvas";
import { isDocEditorHtml } from "@/lib/docEditor";
import { isSketchNotebookHtml } from "@/lib/sketchNotebook";
import type { SketchZoomCommands } from "./useSketchNotebookZoom";

interface LiveEditorRouterProps {
  content: string;
  userTopicId: string;
  onContentChange?: (html: string) => void;
  onViewStateChange?: (state: {
    scrollTop: number;
    scrollLeft?: number;
    scale?: number;
  }) => void;
  /** Compact doc editor for side panels (e.g. lecture notes). */
  compact?: boolean;
  initialScale?: number;
  initialScrollTop?: number;
  initialScrollLeft?: number;
  zoomCommandsRef?: MutableRefObject<SketchZoomCommands | null>;
}

type EditorKind = "sketch" | "doc" | "blank";

function detectKind(html: string): EditorKind {
  if (isSketchNotebookHtml(html)) return "sketch";
  if (isDocEditorHtml(html)) return "doc";
  return "blank";
}

/** Routes shelf-created pages to sketch notebook, doc, or legacy blank canvas. */
export function LiveEditorRouter({
  content,
  userTopicId,
  onContentChange,
  onViewStateChange,
  compact = false,
  initialScale,
  initialScrollTop,
  initialScrollLeft,
  zoomCommandsRef,
}: LiveEditorRouterProps) {
  // Latch kind + seed on first paint so parent re-renders never switch editors
  // or re-feed HTML into a live contentEditable (that steals the caret).
  const kindRef = useRef<EditorKind | null>(null);
  const seedRef = useRef(content);
  if (kindRef.current === null) {
    kindRef.current = detectKind(content);
    seedRef.current = content;
  }
  const kind = kindRef.current;
  const seed = seedRef.current;

  const [drawMode, setDrawMode] = useState(false);
  const [drawTool, setDrawTool] = useState<DrawTool>("pen");
  const [penColor, setPenColor] = useState(DEFAULT_PEN_COLOR);
  const [penSize, setPenSize] = useState(DEFAULT_PEN_SIZE);
  const [canvasBg, setCanvasBg] = useState(() => readCanvasBg(seed));
  const runCmdRef = useRef<(cmd: string, value?: string) => void>(() => undefined);

  if (kind === "sketch") {
    return (
      <SketchNotebookEditor
        key={userTopicId}
        initialHtml={seed}
        onChange={(html) => onContentChange?.(html)}
        onViewStateChange={onViewStateChange}
        initialScale={initialScale}
        initialScrollTop={initialScrollTop}
        initialScrollLeft={initialScrollLeft}
        zoomCommandsRef={zoomCommandsRef}
      />
    );
  }

  if (kind === "doc") {
    return (
      <DocEditor
        key={userTopicId}
        initialHtml={seed}
        onChange={(html) => onContentChange?.(html)}
        onViewStateChange={onViewStateChange}
        compact={compact}
      />
    );
  }

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden bg-[var(--bg-primary)]">
      <BlankEditorToolbar
        drawMode={drawMode}
        onDrawModeChange={setDrawMode}
        drawTool={drawTool}
        onDrawToolChange={setDrawTool}
        onCommand={(cmd, value) => runCmdRef.current(cmd, value)}
        penColor={penColor}
        penSize={penSize}
        onPenColorChange={setPenColor}
        onPenSizeChange={setPenSize}
        canvasBg={canvasBg}
        onCanvasBgChange={setCanvasBg}
      />
      <BlankCanvasEditor
        key={userTopicId}
        initialHtml={seed}
        drawMode={drawMode}
        drawTool={drawTool}
        penColor={penColor}
        penSize={penSize}
        canvasBg={canvasBg}
        onChange={(html) => onContentChange?.(html)}
        onCommandReady={(run) => {
          runCmdRef.current = run;
        }}
        onViewStateChange={onViewStateChange}
      />
      <p className="shrink-0 text-center text-[11px] text-[var(--text-muted)] py-1.5 border-t border-[var(--border)]">
        {drawMode
          ? "Draw freely — changes autosave"
          : "Type mode — click to place text · changes autosave"}
      </p>
    </div>
  );
}
