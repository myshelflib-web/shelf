"use client";

import { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eraser,
  MousePointerClick,
  PenLine,
  Plus,
  Redo2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  SKETCH_BACKGROUNDS,
  SKETCH_TEMPLATES,
  type SketchTemplate,
} from "@/lib/sketchNotebook";
import {
  PEN_COLORS,
  PEN_SIZES,
  type DrawTool,
} from "./BlankEditorToolbar";
import {
  EditorToolbarShell,
  ToolBtn,
  ToolChip,
  ToolGroup,
  ToolMuted,
  ToolSep,
} from "./EditorToolbarChrome";
import { ColorSwatch, ColorSwatchGrid, ToolPopover } from "./ToolPopover";

interface SketchToolbarProps {
  drawTool: DrawTool;
  onDrawToolChange: (tool: DrawTool) => void;
  penColor: string;
  penSize: number;
  onPenColorChange: (c: string) => void;
  onPenSizeChange: (s: number) => void;
  template: SketchTemplate;
  onTemplateChange: (t: SketchTemplate) => void;
  pageBg: string;
  onPageBgChange: (c: string) => void;
  pageIndex: number;
  pageCount: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onAddPage: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  scale: number;
  zoomBy: (delta: number) => void;
}

export function SketchToolbar({
  drawTool,
  onDrawToolChange,
  penColor,
  penSize,
  onPenColorChange,
  onPenSizeChange,
  template,
  onTemplateChange,
  pageBg,
  onPageBgChange,
  pageIndex,
  pageCount,
  onPrevPage,
  onNextPage,
  onAddPage,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  scale,
  zoomBy,
}: SketchToolbarProps) {
  const penBtnRef = useRef<HTMLButtonElement>(null);
  const [penOpen, setPenOpen] = useState(false);

  return (
    <EditorToolbarShell>
      <ToolGroup>
        <ToolBtn
          label="Previous page"
          disabled={pageIndex <= 0}
          onClick={onPrevPage}
        >
          <ChevronLeft className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolMuted>
          <span className="min-w-[3.5rem] text-center tabular-nums inline-block">
            {pageIndex + 1} / {pageCount}
          </span>
        </ToolMuted>
        <ToolBtn
          label="Next page"
          disabled={pageIndex >= pageCount - 1}
          onClick={onNextPage}
        >
          <ChevronRight className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolBtn label="Add page" onClick={onAddPage}>
          <Plus className="w-[17px] h-[17px]" />
        </ToolBtn>
      </ToolGroup>

      <ToolSep />

      <ToolGroup>
        <ToolBtn
          ref={penBtnRef}
          label="Pen"
          active={drawTool === "pen"}
          onClick={() => {
            onDrawToolChange("pen");
            setPenOpen((v) => (drawTool === "pen" ? !v : true));
          }}
        >
          <PenLine className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolBtn
          label="Stroke eraser"
          active={drawTool === "stroke-erase"}
          onClick={() => {
            setPenOpen(false);
            onDrawToolChange("stroke-erase");
          }}
        >
          <Eraser className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolBtn
          label="Object eraser"
          active={drawTool === "object-erase"}
          onClick={() => {
            setPenOpen(false);
            onDrawToolChange("object-erase");
          }}
        >
          <MousePointerClick className="w-[17px] h-[17px]" />
        </ToolBtn>
      </ToolGroup>

      {drawTool === "pen" && (
        <ToolPopover
          open={penOpen}
          onClose={() => setPenOpen(false)}
          anchorEl={penBtnRef.current}
          title="Pen / text color"
        >
          <div className="flex items-center gap-1 mb-3">
            {PEN_SIZES.map((s) => (
              <ToolChip
                key={s.id}
                label={`Pen ${s.label}`}
                active={Math.abs(penSize - s.size) < 0.01}
                onClick={() => onPenSizeChange(s.size)}
              >
                {s.label}
              </ToolChip>
            ))}
          </div>
          <ColorSwatchGrid>
            {PEN_COLORS.map((c) => (
              <ColorSwatch
                key={c.id}
                color={c.color}
                label={c.label}
                selected={penColor === c.color}
                onClick={() => onPenColorChange(c.color)}
              />
            ))}
          </ColorSwatchGrid>
        </ToolPopover>
      )}

      <ToolSep />

      <ToolGroup>
        <ToolMuted>Paper</ToolMuted>
        {SKETCH_TEMPLATES.map((t) => (
          <ToolChip
            key={t.id}
            label={t.hint}
            active={template === t.id}
            onClick={() => onTemplateChange(t.id)}
          >
            {t.label}
          </ToolChip>
        ))}
        {SKETCH_BACKGROUNDS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`w-5 h-5 rounded-md border-2 hover:scale-110 transition-transform ${
              pageBg === c.color
                ? "border-[var(--accent)] scale-110"
                : "border-[var(--border)]"
            }`}
            style={{ background: c.color }}
            title={c.label}
            aria-pressed={pageBg === c.color}
            onClick={() => onPageBgChange(c.color)}
          />
        ))}
      </ToolGroup>

      <ToolSep />

      <ToolGroup>
        <ToolBtn label="Undo (⌘Z)" disabled={!canUndo} onClick={onUndo}>
          <Undo2 className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolBtn label="Redo (⌘⇧Z)" disabled={!canRedo} onClick={onRedo}>
          <Redo2 className="w-[17px] h-[17px]" />
        </ToolBtn>
      </ToolGroup>

      <ToolSep />

      <ToolGroup>
        <ToolBtn label="Zoom out (-)" onClick={() => zoomBy(-0.15)}>
          <ZoomOut className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolMuted>
          <span
            className="min-w-9 text-center tabular-nums inline-block text-[11px]"
            title={`Zoom ${Math.round(scale * 100)}% · pinch or Ctrl+scroll`}
          >
            {Math.round(scale * 100)}%
          </span>
        </ToolMuted>
        <ToolBtn label="Zoom in (=)" onClick={() => zoomBy(0.15)}>
          <ZoomIn className="w-[17px] h-[17px]" />
        </ToolBtn>
      </ToolGroup>
    </EditorToolbarShell>
  );
}
