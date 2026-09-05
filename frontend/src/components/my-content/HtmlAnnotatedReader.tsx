"use client";

import { useCallback, useEffect, useState, type ComponentProps } from "react";
import { PersonalContentArea } from "./PersonalContentArea";
import {
  HtmlDocToolbar,
  type HtmlDocToolMode,
  type HtmlReadingWidth,
} from "./HtmlDocToolbar";
import { DEFAULT_PEN_WIDTH } from "@/lib/straightenStroke";
import type { AnnotationGate } from "@/lib/preloadedReadOnly";
import type { UserContentHighlight } from "@/types";

type ContentProps = ComponentProps<typeof PersonalContentArea>;

type Props = ContentProps & {
  showToolbar?: boolean;
  annotationGate?: AnnotationGate | null;
  showClip?: boolean;
  highlightsHydrating?: boolean;
  onHighlightSelect?: (highlight: UserContentHighlight) => void;
  clipMode?: boolean;
  onClipModeChange?: (clip: boolean) => void;
  pageTitle?: string;
};

function downloadHtmlPage(title: string, html: string) {
  const safe = title.replace(/[^\w\s-]+/g, "").trim() || "page";
  const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${title.replace(/</g, "")}</title></head><body>${html}</body></html>`;
  const blob = new Blob([doc], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

/** HTML library reader: PDF-style annotation toolbar + content (or live editor). */
export function HtmlAnnotatedReader({
  showToolbar = true,
  annotationGate = null,
  showClip = true,
  highlightsHydrating = false,
  onHighlightSelect,
  clipMode: clipModeProp = false,
  onClipModeChange,
  highlights,
  editing = false,
  guestLocked = false,
  onGuestLockedClick,
  pageTitle,
  content,
  ...contentProps
}: Props) {
  const [mode, setMode] = useState<HtmlDocToolMode>(
    clipModeProp ? "clip" : "text"
  );
  const [highlightColorId, setHighlightColorId] = useState("yellow");
  const [highlightWidth, setHighlightWidth] = useState(DEFAULT_PEN_WIDTH);
  const [highlightOpacity, setHighlightOpacity] = useState(0.72);
  const [readingWidth, setReadingWidth] =
    useState<HtmlReadingWidth>("comfortable");
  const [scale, setScale] = useState(1);
  const [darkReading, setDarkReading] = useState(false);

  useEffect(() => {
    if (clipModeProp && mode !== "clip") setMode("clip");
    if (!clipModeProp && mode === "clip") setMode("text");
  }, [clipModeProp, mode]);

  useEffect(() => {
    if (editing && mode !== "text") {
      setMode("text");
      onClipModeChange?.(false);
    }
  }, [editing, mode, onClipModeChange]);

  const setToolMode = (next: HtmlDocToolMode) => {
    setMode(next);
    onClipModeChange?.(next === "clip");
  };

  const zoomBy = useCallback((delta: number) => {
    setScale((s) => Math.min(2, Math.max(0.7, Math.round((s + delta) * 100) / 100)));
  }, []);

  const toolbarVisible = showToolbar && !editing;

  return (
    <div
      className={`flex-1 flex flex-col overflow-hidden min-h-0 min-w-0${
        darkReading ? " html-reader-dark" : ""
      }`}
    >
      {toolbarVisible ? (
        <HtmlDocToolbar
          mode={mode}
          setMode={setToolMode}
          guestLocked={guestLocked}
          annotationGate={annotationGate}
          onLockedClick={onGuestLockedClick}
          showClip={showClip}
          highlights={highlights}
          highlightsHydrating={highlightsHydrating}
          onHighlightSelect={onHighlightSelect}
          highlightColorId={highlightColorId}
          onHighlightColorIdChange={setHighlightColorId}
          highlightWidth={highlightWidth}
          onHighlightWidthChange={setHighlightWidth}
          highlightOpacity={highlightOpacity}
          onHighlightOpacityChange={setHighlightOpacity}
          onDownload={() =>
            downloadHtmlPage(pageTitle || "page", content || "")
          }
          readingWidth={readingWidth}
          onReadingWidthChange={setReadingWidth}
          scale={scale}
          onZoomBy={zoomBy}
          darkReading={darkReading}
          onToggleDarkReading={() => setDarkReading((v) => !v)}
        />
      ) : null}
      <PersonalContentArea
        {...contentProps}
        content={content}
        highlights={highlights}
        editing={editing}
        guestLocked={guestLocked}
        onGuestLockedClick={onGuestLockedClick}
        annotationGate={annotationGate}
        clipMode={!editing && mode === "clip"}
        eraseMode={!editing && mode === "erase"}
        highlightMode={!editing && mode === "highlight"}
        preferredHighlightColorId={highlightColorId}
        highlightWidth={highlightWidth}
        highlightOpacity={highlightOpacity}
        readingWidth={readingWidth}
        contentScale={scale}
      />
    </div>
  );
}
