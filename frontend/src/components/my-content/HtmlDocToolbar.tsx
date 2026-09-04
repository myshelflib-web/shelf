"use client";

import { useRef, useState } from "react";
import {
  Columns2,
  Crop,
  Download,
  Eraser,
  File,
  Highlighter,
  Moon,
  MousePointer2,
  Sun,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { withShortcut } from "@/lib/hotkeys";
import { useIsPhone } from "@/hooks/useIsPhone";
import type { AnnotationGate } from "@/lib/preloadedReadOnly";
import { lockedFeatureLabel } from "@/lib/preloadedReadOnly";
import type { UserContentHighlight } from "@/types";
import { HIGHLIGHT_COLORS } from "@/components/HighlightToolbar";
import {
  EditorToolbarShell,
  ToolBtn,
  ToolGroup,
  ToolMuted,
  ToolSep,
} from "./EditorToolbarChrome";
import { ColorSwatch, ColorSwatchGrid, ToolPopover } from "./ToolPopover";
import { HighlightsToolbarPopover } from "./HighlightsToolbarPopover";

export type HtmlDocToolMode = "text" | "highlight" | "erase" | "clip";
export type HtmlReadingWidth = "comfortable" | "wide";

type Props = {
  mode: HtmlDocToolMode;
  setMode: (mode: HtmlDocToolMode) => void;
  guestLocked?: boolean;
  annotationGate?: AnnotationGate | null;
  onLockedClick?: (feature: string) => void;
  showClip?: boolean;
  highlights?: UserContentHighlight[];
  highlightsHydrating?: boolean;
  onHighlightSelect?: (highlight: UserContentHighlight) => void;
  highlightColorId?: string;
  onHighlightColorIdChange?: (colorId: string) => void;
  onDownload?: () => void;
  readingWidth?: HtmlReadingWidth;
  onReadingWidthChange?: (w: HtmlReadingWidth) => void;
  scale?: number;
  onZoomBy?: (delta: number) => void;
  darkReading?: boolean;
  onToggleDarkReading?: () => void;
};

export function HtmlDocToolbar({
  mode,
  setMode,
  guestLocked = false,
  annotationGate = null,
  onLockedClick,
  showClip = true,
  highlights = [],
  highlightsHydrating = false,
  onHighlightSelect,
  highlightColorId = "yellow",
  onHighlightColorIdChange,
  onDownload,
  readingWidth = "comfortable",
  onReadingWidthChange,
  scale = 1,
  onZoomBy,
  darkReading = false,
  onToggleDarkReading,
}: Props) {
  const isPhone = useIsPhone();
  const highlightBtnRef = useRef<HTMLButtonElement>(null);
  const eraseBtnRef = useRef<HTMLButtonElement>(null);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [eraseOpen, setEraseOpen] = useState(false);

  const lockedTool = guestLocked
    ? "opacity-45 cursor-not-allowed saturate-[0.85]"
    : "";
  const btn = { phone: isPhone };
  const sep = { phone: isPhone };

  const blocked = (feature: string) => {
    if (!guestLocked) return false;
    onLockedClick?.(feature);
    return true;
  };

  const closeExtras = () => {
    setHighlightOpen(false);
    setEraseOpen(false);
  };

  return (
    <EditorToolbarShell phone={isPhone}>
      <ToolGroup>
        <ToolBtn
          {...btn}
          label={
            guestLocked
              ? lockedFeatureLabel(annotationGate, "highlight or ask Study AI")
              : "Select text to highlight or ask Study AI"
          }
          active={mode === "text"}
          onClick={() => {
            setMode("text");
            closeExtras();
          }}
        >
          <MousePointer2 className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolBtn
          {...btn}
          ref={highlightBtnRef}
          label={
            guestLocked
              ? lockedFeatureLabel(annotationGate, "highlight with pen")
              : "Highlighter — select text, then pick a color"
          }
          active={mode === "highlight"}
          className={lockedTool}
          aria-disabled={guestLocked}
          onClick={() => {
            if (blocked("Highlight and annotate")) return;
            if (mode === "highlight") {
              setHighlightOpen((v) => !v);
              return;
            }
            setMode("highlight");
            setEraseOpen(false);
            setHighlightOpen(true);
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
              : "Eraser — click a highlight to remove it"
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
            setHighlightOpen(false);
            setEraseOpen(true);
          }}
        >
          <Eraser className="w-[17px] h-[17px]" />
        </ToolBtn>
        {onHighlightSelect ? (
          <HighlightsToolbarPopover
            highlights={highlights}
            hydrating={highlightsHydrating}
            isPdf={false}
            phone={isPhone}
            onSelect={onHighlightSelect}
          />
        ) : null}
        {showClip ? (
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
              setMode(mode === "clip" ? "text" : "clip");
            }}
          >
            <Crop className="w-[17px] h-[17px]" />
          </ToolBtn>
        ) : null}
        {onDownload ? (
          <ToolBtn {...btn} label="Download page" onClick={onDownload}>
            <Download className="w-[17px] h-[17px]" />
          </ToolBtn>
        ) : null}
      </ToolGroup>

      <ToolSep {...sep} />

      {!isPhone && onReadingWidthChange ? (
        <>
          <ToolGroup>
            <ToolBtn
              {...btn}
              label="Comfortable reading width"
              active={readingWidth === "comfortable"}
              onClick={() => onReadingWidthChange("comfortable")}
            >
              <File className="w-[17px] h-[17px]" />
            </ToolBtn>
            <ToolBtn
              {...btn}
              label="Wide reading width"
              active={readingWidth === "wide"}
              onClick={() => onReadingWidthChange("wide")}
            >
              <Columns2 className="w-[17px] h-[17px]" />
            </ToolBtn>
          </ToolGroup>
          <ToolSep {...sep} />
        </>
      ) : null}

      {onZoomBy ? (
        <ToolGroup>
          <ToolBtn
            {...btn}
            label={withShortcut("Zoom out", "-")}
            onClick={() => onZoomBy(-0.1)}
          >
            <ZoomOut className="w-[17px] h-[17px]" />
          </ToolBtn>
          <ToolMuted>{Math.round(scale * 100)}%</ToolMuted>
          <ToolBtn
            {...btn}
            label={withShortcut("Zoom in", "=")}
            onClick={() => onZoomBy(0.1)}
          >
            <ZoomIn className="w-[17px] h-[17px]" />
          </ToolBtn>
          {onToggleDarkReading ? (
            <ToolBtn
              {...btn}
              label={
                darkReading
                  ? "Switch to light reading"
                  : "Switch to dark reading"
              }
              active={darkReading}
              onClick={onToggleDarkReading}
            >
              {darkReading ? (
                <Moon className="w-[17px] h-[17px]" />
              ) : (
                <Sun className="w-[17px] h-[17px]" />
              )}
            </ToolBtn>
          ) : null}
        </ToolGroup>
      ) : null}

      <ToolPopover
        open={highlightOpen && mode === "highlight" && !guestLocked}
        onClose={() => setHighlightOpen(false)}
        anchorEl={highlightBtnRef.current}
        title="Highlight color"
      >
        <p className="text-[11px] text-[var(--text-muted)] mb-2.5 leading-relaxed">
          Select text on the page — a menu appears to highlight, add a note, or
          ask Study AI. Preferred color:
        </p>
        <ColorSwatchGrid>
          {HIGHLIGHT_COLORS.map((c) => (
            <ColorSwatch
              key={c.id}
              color={c.hex}
              label={`Highlight ${c.id}`}
              selected={highlightColorId === c.id}
              onClick={() => {
                onHighlightColorIdChange?.(c.id);
                setHighlightOpen(false);
              }}
            />
          ))}
        </ColorSwatchGrid>
      </ToolPopover>

      <ToolPopover
        open={eraseOpen && mode === "erase" && !guestLocked}
        onClose={() => setEraseOpen(false)}
        anchorEl={eraseBtnRef.current}
        title="Eraser"
      >
        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
          Click any highlighted passage on the page to remove it. You can also
          select a highlight and use the × on the popup.
        </p>
      </ToolPopover>
    </EditorToolbarShell>
  );
}
