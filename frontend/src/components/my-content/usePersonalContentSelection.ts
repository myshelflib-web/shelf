"use client";

import {
  useCallback,
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

/** ContentArea-style: read selection on mouseup only. */
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

  const downRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    downRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseUp = useCallback(() => {
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

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (editing || clipMode) return;
      const live = window.getSelection();
      if (live && !live.isCollapsed) return;
      const down = downRef.current;
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
      const highlight = highlights.find((h) => h.id === id);
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
      highlights,
      originRef,
      boxesRef,
      onGuestLockedClick,
      removeHighlightNow,
      setActiveHighlight,
      setSelection,
    ]
  );

  return { handleMouseDown, handleMouseUp, handleClick };
}
