"use client";

import type { RefObject } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import {
  Columns2,
  Crop,
  Download,
  Eraser,
  File,
  Highlighter,
  Moon,
  MousePointer2,
  MousePointerClick,
  PenLine,
  Pencil,
  Settings2,
  Sun,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { withShortcut } from "@/lib/hotkeys";
import { INK_WIDTHS, PEN_WIDTHS } from "@/lib/straightenStroke";
import { PEN_COLORS } from "./BlankEditorToolbar";
import {
  EditorToolbarShell,
  ToolBtn,
  ToolChip,
  ToolGroup,
  ToolMuted,
  ToolSep,
} from "./EditorToolbarChrome";
import { PdfPageNav } from "./PdfPageNav";

export type PdfToolbarMode = "text" | "pen" | "ink" | "erase" | "clip";

type Props = {
  currentPage: number;
  numPages: number;
  pdfDoc: PDFDocumentProxy | null;
  canDeletePages: boolean;
  deletingPages: boolean;
  onGoToPage: (page: number) => void;
  onDeletePages: (pages: number[]) => void | Promise<void>;
  onOpenPagePreview: () => void;
  onOpenPdfEdit?: () => void;
  mode: PdfToolbarMode;
  setMode: (
    mode: PdfToolbarMode | ((m: PdfToolbarMode) => PdfToolbarMode)
  ) => void;
  guestLocked: boolean;
  lockedTool: string;
  blocked: (feature: string) => boolean;
  penCursorHide: () => void;
  downloadPdf: () => void | Promise<void>;
  penWidth: number;
  setPenWidth: (w: number) => void;
  penSettingsOpen: boolean;
  setPenSettingsOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  penSettingsBtnRef: RefObject<HTMLButtonElement | null>;
  inkWidth: number;
  setInkWidth: (w: number) => void;
  inkColor: string;
  setInkColor: (c: string) => void;
  eraseKind: "stroke" | "object";
  setEraseKind: (k: "stroke" | "object") => void;
  showClip: boolean;
  canUndoMark: boolean;
  undoMark: () => void | Promise<void>;
  pageLayout: "single" | "spread";
  setSheetLayout: (layout: "single" | "spread") => void;
  scale: number;
  zoomBy: (delta: number) => void;
  darkPdf: boolean;
  toggleDarkPdf: () => void;
};

export function PdfToolbar(props: Props) {
  const {
    currentPage,
    numPages,
    pdfDoc,
    canDeletePages,
    deletingPages,
    onGoToPage,
    onDeletePages,
    onOpenPagePreview,
    onOpenPdfEdit,
    mode,
    setMode,
    guestLocked,
    lockedTool,
    blocked,
    penCursorHide,
    downloadPdf,
    penWidth,
    setPenWidth,
    penSettingsOpen,
    setPenSettingsOpen,
    penSettingsBtnRef,
    inkWidth,
    setInkWidth,
    inkColor,
    setInkColor,
    eraseKind,
    setEraseKind,
    showClip,
    canUndoMark,
    undoMark,
    pageLayout,
    setSheetLayout,
    scale,
    zoomBy,
    darkPdf,
    toggleDarkPdf,
  } = props;

  return (
    <EditorToolbarShell>
      <ToolGroup>
        <PdfPageNav
          compact
          currentPage={currentPage}
          numPages={numPages}
          pdfDoc={pdfDoc}
          onGoToPage={onGoToPage}
          onOpenPagePreview={onOpenPagePreview}
        />
      </ToolGroup>

      {canDeletePages && onOpenPdfEdit && (
        <>
          <ToolSep />
          <ToolGroup>
            <ToolBtn
              label="Edit PDF — remove pages"
              onClick={onOpenPdfEdit}
            >
              <Pencil className="w-[17px] h-[17px]" />
            </ToolBtn>
          </ToolGroup>
        </>
      )}

      <ToolSep />

      <ToolGroup>
        <ToolBtn
          label={
            guestLocked
              ? "Sign in to highlight or ask Study AI"
              : "Select text to highlight or ask Study AI"
          }
          active={mode === "text"}
          onClick={() => {
            setMode("text");
            setPenSettingsOpen(false);
            penCursorHide();
          }}
        >
          <MousePointer2 className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolBtn
          label={
            guestLocked
              ? "Sign in to write on the page"
              : "Pen — underline or write on the page"
          }
          active={mode === "ink"}
          className={lockedTool}
          aria-disabled={guestLocked}
          onClick={() => {
            if (blocked("Highlight and annotate")) return;
            setMode("ink");
            setPenSettingsOpen(false);
          }}
        >
          <PenLine className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolBtn
          label={
            guestLocked
              ? "Sign in to highlight with pen"
              : "Draw highlighter strokes on the page"
          }
          active={mode === "pen"}
          className={lockedTool}
          aria-disabled={guestLocked}
          onClick={() => {
            if (blocked("Highlight and annotate")) return;
            setMode("pen");
            setPenSettingsOpen(true);
          }}
        >
          <Highlighter className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolBtn
          label={guestLocked ? "Sign in to erase highlights" : "Eraser"}
          active={mode === "erase"}
          className={lockedTool}
          aria-disabled={guestLocked}
          onClick={() => {
            if (blocked("Highlight and annotate")) return;
            setMode("erase");
            setPenSettingsOpen(false);
            penCursorHide();
          }}
        >
          <Eraser className="w-[17px] h-[17px]" />
        </ToolBtn>
        {showClip && (
          <ToolBtn
            label={
              guestLocked
                ? "Sign in to clip regions"
                : "Clip a region of the page as an image"
            }
            active={mode === "clip"}
            className={lockedTool}
            aria-disabled={guestLocked}
            onClick={() => {
              if (blocked("Save clips")) return;
              setPenSettingsOpen(false);
              penCursorHide();
              setMode((m) => (m === "clip" ? "text" : "clip"));
            }}
          >
            <Crop className="w-[17px] h-[17px]" />
          </ToolBtn>
        )}
        <ToolBtn label="Download PDF" onClick={() => void downloadPdf()}>
          <Download className="w-[17px] h-[17px]" />
        </ToolBtn>
      </ToolGroup>

      {mode === "pen" && (
        <>
          <ToolSep />
          <ToolGroup>
            {PEN_WIDTHS.map((s) => (
              <ToolChip
                key={s.id}
                label={s.title}
                active={Math.abs(penWidth - s.width) < 0.00015}
                onClick={() => setPenWidth(s.width)}
              >
                {s.label}
              </ToolChip>
            ))}
            <ToolBtn
              ref={penSettingsBtnRef}
              label="Thickness and opacity"
              active={penSettingsOpen}
              onClick={() => setPenSettingsOpen((v) => !v)}
            >
              <Settings2 className="w-[17px] h-[17px]" />
            </ToolBtn>
          </ToolGroup>
        </>
      )}

      {mode === "ink" && (
        <>
          <ToolSep />
          <ToolGroup>
            {INK_WIDTHS.map((s) => (
              <ToolChip
                key={s.id}
                label={`Pen ${s.title}`}
                active={Math.abs(inkWidth - s.width) < 0.00015}
                onClick={() => setInkWidth(s.width)}
              >
                {s.label}
              </ToolChip>
            ))}
            {PEN_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`w-5 h-5 rounded-full border-2 hover:scale-110 transition-transform ${
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
          </ToolGroup>
        </>
      )}

      {mode === "erase" && (
        <>
          <ToolSep />
          <ToolGroup>
            <ToolChip
              label="Stroke eraser — drag over ink"
              active={eraseKind === "stroke"}
              onClick={() => setEraseKind("stroke")}
            >
              <Eraser className="w-3 h-3" />
              Stroke
            </ToolChip>
            <ToolChip
              label="Object eraser — click a mark to delete it"
              active={eraseKind === "object"}
              onClick={() => setEraseKind("object")}
            >
              <MousePointerClick className="w-3 h-3" />
              Object
            </ToolChip>
          </ToolGroup>
        </>
      )}

      <ToolSep />

      <ToolGroup>
        <ToolBtn
          label={
            guestLocked
              ? "Sign in to undo marks"
              : withShortcut("Undo last mark", "mod+z")
          }
          className={lockedTool}
          disabled={!canUndoMark || guestLocked}
          onClick={() => {
            if (blocked("Highlight and annotate")) return;
            void undoMark();
          }}
        >
          <Undo2 className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolBtn
          label="A4 sheet — one page"
          active={pageLayout === "single"}
          onClick={() => setSheetLayout("single")}
        >
          <File className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolBtn
          label="A4 sheets — two pages side by side"
          active={pageLayout === "spread"}
          onClick={() => setSheetLayout("spread")}
        >
          <Columns2 className="w-[17px] h-[17px]" />
        </ToolBtn>
      </ToolGroup>

      <ToolSep />

      <ToolGroup>
        <ToolBtn
          label={withShortcut("Zoom out", "-")}
          onClick={() => zoomBy(-0.15)}
        >
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
        <ToolBtn
          label={withShortcut("Zoom in", "=")}
          onClick={() => zoomBy(0.15)}
        >
          <ZoomIn className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolBtn
          label={
            darkPdf
              ? withShortcut("Switch to light PDF pages", "m")
              : withShortcut("Night mode — darken white PDF pages", "m")
          }
          active={darkPdf}
          onClick={toggleDarkPdf}
        >
          {darkPdf ? (
            <Sun className="w-[17px] h-[17px]" />
          ) : (
            <Moon className="w-[17px] h-[17px]" />
          )}
        </ToolBtn>
      </ToolGroup>
    </EditorToolbarShell>
  );
}
