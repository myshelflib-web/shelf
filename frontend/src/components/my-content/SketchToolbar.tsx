"use client";

import {
  ChevronLeft,
  ChevronRight,
  Eraser,
  MousePointerClick,
  PenLine,
  Plus,
  Redo2,
  Undo2,
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
}: SketchToolbarProps) {
  return (
    <div className="shrink-0 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
      <div className="flex items-center justify-center gap-0.5 px-3 py-2 overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-0.5 shrink-0">
      <button
        type="button"
        className="p-1.5 rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] disabled:opacity-40"
        title="Undo (⌘Z)"
        disabled={!canUndo}
        onClick={onUndo}
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="p-1.5 rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] disabled:opacity-40"
        title="Redo (⌘⇧Z)"
        disabled={!canRedo}
        onClick={onRedo}
      >
        <Redo2 className="w-4 h-4" />
      </button>
      </div>

      <div className="w-px h-6 bg-[var(--border)] mx-1 shrink-0" />

      <div className="flex items-center gap-0.5 mr-1 rounded-lg bg-[var(--bg-secondary)] p-0.5 shrink-0">
        <button
          type="button"
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium ${
            drawTool === "pen"
              ? "bg-[var(--accent)] text-white shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
          title="Pen"
          aria-pressed={drawTool === "pen"}
          onClick={() => onDrawToolChange("pen")}
        >
          <PenLine className="w-3.5 h-3.5" />
          Pen
        </button>
        <button
          type="button"
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium ${
            drawTool === "stroke-erase"
              ? "bg-[var(--accent)] text-white shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
          title="Stroke eraser"
          aria-pressed={drawTool === "stroke-erase"}
          onClick={() => onDrawToolChange("stroke-erase")}
        >
          <Eraser className="w-3.5 h-3.5" />
          Stroke
        </button>
        <button
          type="button"
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium ${
            drawTool === "object-erase"
              ? "bg-[var(--accent)] text-white shadow-sm"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
          title="Object eraser"
          aria-pressed={drawTool === "object-erase"}
          onClick={() => onDrawToolChange("object-erase")}
        >
          <MousePointerClick className="w-3.5 h-3.5" />
          Object
        </button>
      </div>

      {drawTool === "pen" && (
        <div className="flex items-center gap-0.5 shrink-0">
          <span className="text-[10px] font-medium text-[var(--text-muted)] mr-1">
            Size
          </span>
          {PEN_SIZES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`min-w-[1.6rem] h-7 px-1 rounded-md text-[10px] font-semibold ${
                Math.abs(penSize - s.size) < 0.01
                  ? "bg-[var(--accent)] text-white"
                  : "hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
              }`}
              title={`Pen ${s.label}`}
              aria-pressed={Math.abs(penSize - s.size) < 0.01}
              onClick={() => onPenSizeChange(s.size)}
            >
              {s.label}
            </button>
          ))}
          <div className="w-px h-6 bg-[var(--border)] mx-1" />
          {PEN_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`w-5 h-5 rounded-full border-2 hover:scale-110 transition-transform ${
                penColor === c.color
                  ? "border-[var(--accent)] scale-110"
                  : c.id === "white"
                    ? "border-[var(--border)]"
                    : "border-transparent"
              }`}
              style={{ background: c.color }}
              title={c.label}
              aria-pressed={penColor === c.color}
              onClick={() => onPenColorChange(c.color)}
            />
          ))}
        </div>
      )}

      <div className="w-px h-6 bg-[var(--border)] mx-1 shrink-0" />

      <div className="flex items-center gap-0.5 shrink-0">
      <span className="text-[10px] font-medium text-[var(--text-muted)] mr-1">
        Paper
      </span>
      {SKETCH_TEMPLATES.map((t) => (
        <button
          key={t.id}
          type="button"
          title={t.hint}
          className={`px-2 py-1 rounded-md text-[10px] font-medium ${
            template === t.id
              ? "bg-[var(--accent)] text-white"
              : "hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
          }`}
          aria-pressed={template === t.id}
          onClick={() => onTemplateChange(t.id)}
        >
          {t.label}
        </button>
      ))}
      </div>

      <div className="w-px h-6 bg-[var(--border)] mx-1 shrink-0" />

      <div className="flex items-center gap-0.5 shrink-0">
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
      </div>

      <div className="w-px h-6 bg-[var(--border)] mx-1 shrink-0" />

      <div className="flex items-center gap-0.5 rounded-lg bg-[var(--bg-secondary)] p-0.5 shrink-0">
        <button
          type="button"
          className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40"
          disabled={pageIndex <= 0}
          title="Previous page"
          onClick={onPrevPage}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[11px] tabular-nums text-[var(--text-secondary)] px-1 min-w-[3.5rem] text-center">
          {pageIndex + 1} / {pageCount}
        </span>
        <button
          type="button"
          className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40"
          disabled={pageIndex >= pageCount - 1}
          title="Next page"
          onClick={onNextPage}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-[var(--accent)] hover:bg-[var(--accent-light)]"
          title="Add page"
          onClick={onAddPage}
        >
          <Plus className="w-3.5 h-3.5" />
          Page
        </button>
      </div>
      </div>
    </div>
  );
}
