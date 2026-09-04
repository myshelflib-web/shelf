"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { PersonalContentArea } from "./PersonalContentArea";
import {
  HtmlDocToolbar,
  type HtmlDocToolMode,
} from "./HtmlDocToolbar";
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
};

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
  ...contentProps
}: Props) {
  const [mode, setMode] = useState<HtmlDocToolMode>(
    clipModeProp ? "clip" : "text"
  );
  const [highlightColorId, setHighlightColorId] = useState("yellow");

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

  const toolbarVisible = showToolbar && !editing;

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0 min-w-0">
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
        />
      ) : null}
      <PersonalContentArea
        {...contentProps}
        highlights={highlights}
        editing={editing}
        guestLocked={guestLocked}
        onGuestLockedClick={onGuestLockedClick}
        clipMode={!editing && mode === "clip"}
        eraseMode={!editing && mode === "erase"}
      />
    </div>
  );
}
