"use client";

import {
  useCallback,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type { UserContentHighlight } from "@/types";
import { highlightRangeKey } from "@/lib/applyHighlights";
import { readArticleTextSelection } from "./readArticleTextSelection";

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

/**
 * Native-selection first (same idea as ContentArea / typical web highlighters):
 * never setState on mousedown — that re-render cancels the browser selection.
 */
export function usePersonalContentSelection(opts: {
  editing: boolean;
  readOnly: boolean;
  clipMode: boolean;
  eraseMode: boolean;
  guestLocked: boolean;
  highlights: UserContentHighlight[];
  contentRootRef: MutableRefObject<HTMLElement | null>;
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

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (clipMode) return;
      pointerDownRef.current = { x: e.clientX, y: e.clientY };
    },
    [clipMode]
  );

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

      const down = pointerDownRef.current;
      pointerDownRef.current = null;
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) {
        return;
      }

      const mark = (e.target as HTMLElement).closest(
        "mark[data-highlight-range], mark[data-highlight-id]"
      );
      if (!mark) return;
      const rangeAttr = mark.getAttribute("data-highlight-range");
      const legacyId = mark.getAttribute("data-highlight-id");
      const highlight = rangeAttr
        ? highlights.find(
            (h) => highlightRangeKey(h.startOffset, h.endOffset) === rangeAttr
          )
        : highlights.find((h) => h.id === legacyId);
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
      const r = mark.getBoundingClientRect();
      setActiveHighlight({
        highlight,
        rect: new DOMRect(r.left, r.top, r.width, r.height),
      });
    },
    [
      editing,
      clipMode,
      eraseMode,
      guestLocked,
      highlights,
      onGuestLockedClick,
      removeHighlightNow,
      setActiveHighlight,
      setSelection,
    ]
  );

  return { handleMouseUp, handleMouseDown, handleClick };
}
