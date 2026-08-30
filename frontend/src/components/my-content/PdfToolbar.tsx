"use client";

import { useRef, useState, type RefObject } from "react";
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
  Share2,
  Star,
  Sun,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import clsx from "clsx";
import { withShortcut } from "@/lib/hotkeys";
import type { AnnotationGate } from "@/lib/preloadedReadOnly";
import { lockedFeatureLabel } from "@/lib/preloadedReadOnly";
import { useIsPhone } from "@/hooks/useIsPhone";
import { INK_WIDTHS } from "@/lib/straightenStroke";
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
import { ColorSwatch, ColorSwatchGrid, ToolPopover } from "./ToolPopover";

export type PdfToolbarMode = "text" | "pen" | "ink" | "erase" | "clip";

export type PdfPhoneChrome = {
  starred: boolean;
  onToggleStar?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
};

type Props = {
  currentPage: number;
  numPages: number;
  pdfDoc: PDFDocumentProxy | null;
  canDeletePages: boolean;
  deletingPages: boolean;
  onGoToPage: (page: number) => void;
  onDeletePages: (pages: number[]) => void | Promise<void>;
  mode: PdfToolbarMode;
  setMode: (
    mode: PdfToolbarMode | ((m: PdfToolbarMode) => PdfToolbarMode)
  ) => void;
  guestLocked: boolean;
  annotationGate?: AnnotationGate | null;
  lockedTool: string;
  blocked: (feature: string) => boolean | void;
  penCursorHide: () => void;
  downloadPdf: () => void | Promise<void>;
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
  phoneChrome?: PdfPhoneChrome;
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
    mode,
    setMode,
    guestLocked,
    annotationGate,
    lockedTool,
    blocked,
    penCursorHide,
    downloadPdf,
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
    phoneChrome,
  } = props;

  const inkBtnRef = useRef<HTMLButtonElement>(null);
  const eraseBtnRef = useRef<HTMLButtonElement>(null);
  const [inkOpen, setInkOpen] = useState(false);
  const [eraseOpen, setEraseOpen] = useState(false);
  const isPhone = useIsPhone();

  const closeExtras = () => {
    setInkOpen(false);
    setEraseOpen(false);
    setPenSettingsOpen(false);
  };

  const btn = { phone: isPhone };
  const sep = { phone: isPhone };

  return (
    <EditorToolbarShell phone={isPhone}>
      <ToolGroup>
        <PdfPageNav
          compact
          phone={isPhone}
          currentPage={currentPage}
          numPages={numPages}
          pdfDoc={pdfDoc}
          canDeletePages={canDeletePages}
          deletingPages={deletingPages}
          onGoToPage={onGoToPage}
          onDeletePages={onDeletePages}
        />
      </ToolGroup>

      <ToolSep {...sep} />

      <ToolGroup>
        <ToolBtn
          {...btn}
          label={
            guestLocked
              ? lockedFeatureLabel(
                  annotationGate,
                  "highlight or ask Study AI"
                )
              : "Select text to highlight or ask Study AI"
          }
          active={mode === "text"}
          onClick={() => {
            setMode("text");
            closeExtras();
            penCursorHide();
          }}
        >
          <MousePointer2 className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolBtn
          {...btn}
          ref={inkBtnRef}
          label={
            guestLocked
              ? lockedFeatureLabel(annotationGate, "write on the page")
              : "Pen — underline or write on the page"
          }
          active={mode === "ink"}
          className={lockedTool}
          aria-disabled={guestLocked}
          onClick={() => {
            if (blocked("Highlight and annotate")) return;
            if (mode === "ink") {
              setInkOpen((v) => !v);
              return;
            }
            setMode("ink");
            setPenSettingsOpen(false);
            setEraseOpen(false);
            setInkOpen(true);
          }}
        >
          <PenLine className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolBtn
          {...btn}
          ref={penSettingsBtnRef}
          label={
            guestLocked
              ? lockedFeatureLabel(annotationGate, "highlight with pen")
              : "Draw highlighter strokes on the page"
          }
          active={mode === "pen"}
          className={lockedTool}
          aria-disabled={guestLocked}
          onClick={() => {
            if (blocked("Highlight and annotate")) return;
            if (mode === "pen") {
              setPenSettingsOpen((v) => !v);
              return;
            }
            setMode("pen");
            setInkOpen(false);
            setEraseOpen(false);
            setPenSettingsOpen(true);
          }}
        >
          <Highlighter className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolBtn
          {...btn}
          ref={eraseBtnRef}
          label={
            guestLocked
              ? lockedFeatureLabel(annotationGate, "erase highlights")
              : "Eraser"
          }
          active={mode === "erase"}
          className={lockedTool}
          aria-disabled={guestLocked}
          onClick={() => {
            if (blocked("Highlight and annotate")) return;
            if (mode === "erase") {
              setEraseOpen((v) => !v);
              return;
            }
            setMode("erase");
            setPenSettingsOpen(false);
            setInkOpen(false);
            setEraseOpen(true);
            penCursorHide();
          }}
        >
          <Eraser className="w-[17px] h-[17px]" />
        </ToolBtn>
        {showClip && (
          <ToolBtn
            {...btn}
            label={
              guestLocked
                ? lockedFeatureLabel(annotationGate, "clip regions")
                : "Clip a region of the page as an image"
            }
            active={mode === "clip"}
            className={lockedTool}
            aria-disabled={guestLocked}
            onClick={() => {
              if (blocked("Save clips")) return;
              closeExtras();
              penCursorHide();
              setMode((m) => (m === "clip" ? "text" : "clip"));
            }}
          >
            <Crop className="w-[17px] h-[17px]" />
          </ToolBtn>
        )}
        {!isPhone ? (
          <ToolBtn {...btn} label="Download PDF" onClick={() => void downloadPdf()}>
            <Download className="w-[17px] h-[17px]" />
          </ToolBtn>
        ) : null}
      </ToolGroup>

      <ToolPopover
        open={inkOpen && mode === "ink"}
        onClose={() => setInkOpen(false)}
        anchorEl={inkBtnRef.current}
        title="Pen / text color"
      >
        <div className="flex items-center gap-1 mb-3">
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
        </div>
        <ColorSwatchGrid>
          {PEN_COLORS.map((c) => (
            <ColorSwatch
              key={c.id}
              color={c.color}
              label={`Pen ${c.label}`}
              selected={inkColor === c.color}
              onClick={() => setInkColor(c.color)}
            />
          ))}
        </ColorSwatchGrid>
      </ToolPopover>

      <ToolPopover
        open={eraseOpen && mode === "erase"}
        onClose={() => setEraseOpen(false)}
        anchorEl={eraseBtnRef.current}
        title="Eraser"
      >
        <div className="flex flex-col gap-1.5">
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
        </div>
      </ToolPopover>

      <ToolSep {...sep} />

      <ToolGroup>
        <ToolBtn
          {...btn}
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
        {!isPhone ? (
          <>
            <ToolBtn
              {...btn}
              label="A4 sheet — one page"
              active={pageLayout === "single"}
              onClick={() => setSheetLayout("single")}
            >
              <File className="w-[17px] h-[17px]" />
            </ToolBtn>
            <ToolBtn
              {...btn}
              label="A4 sheets — two pages side by side"
              active={pageLayout === "spread"}
              onClick={() => setSheetLayout("spread")}
            >
              <Columns2 className="w-[17px] h-[17px]" />
            </ToolBtn>
          </>
        ) : null}
      </ToolGroup>

      {phoneChrome ? (
        <>
          <ToolSep {...sep} />
          <ToolGroup>
            {phoneChrome.onShare ? (
              <ToolBtn {...btn} label="Share this page" onClick={phoneChrome.onShare}>
                <Share2 className="w-[17px] h-[17px]" />
              </ToolBtn>
            ) : null}
            {phoneChrome.onToggleStar ? (
              <ToolBtn
                {...btn}
                label={withShortcut(
                  phoneChrome.starred ? "Remove star" : "Star this page",
                  "*"
                )}
                active={phoneChrome.starred}
                className={phoneChrome.starred ? "text-amber-400" : undefined}
                onClick={phoneChrome.onToggleStar}
              >
                <Star
                  className={clsx(
                    "w-[17px] h-[17px]",
                    phoneChrome.starred && "fill-amber-400"
                  )}
                />
              </ToolBtn>
            ) : null}
            {phoneChrome.onDelete ? (
              <ToolBtn {...btn} label="Delete page" onClick={phoneChrome.onDelete}>
                <Trash2 className="w-[17px] h-[17px]" />
              </ToolBtn>
            ) : null}
          </ToolGroup>
        </>
      ) : null}

      <ToolSep {...sep} />

      <ToolGroup>
        <ToolBtn {...btn} label={withShortcut("Zoom out", "-")} onClick={() => zoomBy(-0.15)}>
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
        <ToolBtn {...btn} label={withShortcut("Zoom in", "=")} onClick={() => zoomBy(0.15)}>
          <ZoomIn className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolBtn
          {...btn}
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
