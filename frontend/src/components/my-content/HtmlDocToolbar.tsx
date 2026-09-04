"use client";

import { useRef, useState } from "react";
import {
  Crop,
  Eraser,
  Highlighter,
  MousePointer2,
} from "lucide-react";
import { useIsPhone } from "@/hooks/useIsPhone";
import type { AnnotationGate } from "@/lib/preloadedReadOnly";
import { lockedFeatureLabel } from "@/lib/preloadedReadOnly";
import type { UserContentHighlight } from "@/types";
import { HIGHLIGHT_COLORS } from "@/components/HighlightToolbar";
import {
  EditorToolbarShell,
  ToolBtn,
  ToolGroup,
  ToolSep,
} from "./EditorToolbarChrome";
import { ColorSwatch, ColorSwatchGrid, ToolPopover } from "./ToolPopover";
import { HighlightsToolbarPopover } from "./HighlightsToolbarPopover";

export type HtmlDocToolMode = "text" | "erase" | "clip";

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
  /** Preferred color id for the next text highlight (e.g. "yellow"). */
  highlightColorId?: string;
  onHighlightColorIdChange?: (colorId: string) => void;
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
              : "Highlight — select text, then pick a color"
          }
          active={mode === "text" && highlightOpen}
          className={lockedTool}
          aria-disabled={guestLocked}
          onClick={() => {
            if (blocked("Highlight and annotate")) return;
            setMode("text");
            setEraseOpen(false);
            setHighlightOpen((v) => !v);
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
      </ToolGroup>

      <ToolSep {...sep} />

      <ToolPopover
        open={highlightOpen && mode === "text" && !guestLocked}
        onClose={() => setHighlightOpen(false)}
        anchorEl={highlightBtnRef.current}
        title="Highlight color"
      >
        <p className="text-[11px] text-[var(--text-muted)] mb-2.5 leading-relaxed">
          Select text on the page, then choose a color from the menu — or set a
          preferred color here for the next highlight.
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
          Click any highlighted passage on the page to remove it.
        </p>
      </ToolPopover>
    </EditorToolbarShell>
  );
}
