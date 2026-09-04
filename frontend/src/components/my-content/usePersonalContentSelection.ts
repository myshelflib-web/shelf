"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type { UserContentHighlight } from "@/types";
import { readArticleTextSelection } from "./readArticleTextSelection";
import {
  highlightIdAtPoint,
  type OverlayBox,
} from "./htmlHighlightGeometry";

type SelectionState = {
  text: string;
  rect: DOMRect;
  startOffset: number;
  endOffset: number;
};

type ActiveHighlight = {
  highlight: UserContentHighlight;
  rect: DOMRect;
};

/** Mouseup-only selection — same model as ContentArea. No mousedown setState. */
export function usePersonalContentSelection(opts: {
  editing: boolean;
  readOnly: boolean;
  clipMode: boolean;
  eraseMode: boolean;
  guestLocked: boolean;
  highlights: UserContentHighlight[];
  contentRootRef: MutableRefObject<HTMLElement | null>;
  originRef: MutableRefObject<HTMLElement | null>;
  boxesRef: MutableRefObject<OverlayBox[]>;
  selectionRef: MutableRefObject<{
    text: string;
    startOffset: number;
    endOffset: number;
  } | null>;
  highlightModeRef: MutableRefObject<boolean>;
  preferredColorRef: MutableRefObject<string>;
  saveHighlightRef: MutableRefObject<(color: string, note?: string) => void>;
  setSelection: Dispatch<SetStateAction<SelectionState | null>>;
  setActiveHighlight: Dispatch<SetStateAction<ActiveHighlight | null>>;
  onGuestLockedClick?: (feature: string) => void;
  removeHighlightNow: (id: string) => void;
}) {
  const {
    editing,
    readOnly,
    clipMode,
    eraseMode,
    guestLocked,
    highlights,
    contentRootRef,
    originRef,
    boxesRef,
    selectionRef,
    highlightModeRef,
    preferredColorRef,
    saveHighlightRef,
    setSelection,
    setActiveHighlight,
    onGuestLockedClick,
    removeHighlightNow,
  } = opts;

  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
  const highlightsRef = useRef(highlights);
  highlightsRef.current = highlights;

  const readSelection = useCallback(() => {
    if (editing || readOnly || clipMode || eraseMode) return;
    const root = contentRootRef.current;
    const next = root ? readArticleTextSelection(root) : null;
    if (!next) {
      setSelection(null);
      selectionRef.current = null;
      return;
    }
    selectionRef.current = next;
    setActiveHighlight(null);
    if (highlightModeRef.current) {
      setSelection(null);
      saveHighlightRef.current?.(preferredColorRef.current);
      window.getSelection()?.removeAllRanges();
      return;
    }
    setSelection(next);
  }, [
    editing,
    readOnly,
    clipMode,
    eraseMode,
    contentRootRef,
    selectionRef,
    highlightModeRef,
    preferredColorRef,
    saveHighlightRef,
    setSelection,
    setActiveHighlight,
  ]);

  useEffect(() => {
    const root = contentRootRef.current;
    if (!root || editing || clipMode) return;
    const onUp = () => readSelection();
    const onDown = (e: MouseEvent) => {
      pointerDownRef.current = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      readSelection();
    };
    root.addEventListener("mousedown", onDown);
    root.addEventListener("mouseup", onUp);
    root.addEventListener("pointerup", onPointerUp);
    return () => {
      root.removeEventListener("mousedown", onDown);
      root.removeEventListener("mouseup", onUp);
      root.removeEventListener("pointerup", onPointerUp);
    };
  }, [contentRootRef, editing, clipMode, readSelection]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (editing || clipMode) return;
      const live = window.getSelection();
      if (live && !live.isCollapsed) return;
      const down = pointerDownRef.current;
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) {
        return;
      }
      const origin = originRef.current?.getBoundingClientRect();
      if (!origin) return;
      const id = highlightIdAtPoint(
        boxesRef.current,
        e.clientX - origin.left,
        e.clientY - origin.top
      );
      if (!id) return;
      const highlight = highlightsRef.current.find((h) => h.id === id);
      if (!highlight) return;
      setSelection(null);
      if (eraseMode) {
        if (guestLocked) {
          onGuestLockedClick?.("Highlight and annotate");
          return;
        }
        removeHighlightNow(highlight.id);
        return;
      }
      setActiveHighlight({
        highlight,
        rect: new DOMRect(e.clientX, e.clientY, 1, 1),
      });
    },
    [
      editing,
      clipMode,
      eraseMode,
      guestLocked,
      originRef,
      boxesRef,
      onGuestLockedClick,
      removeHighlightNow,
      setActiveHighlight,
      setSelection,
    ]
  );

  return { handleClick };
}
