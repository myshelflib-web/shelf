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

/** Mouse selection + mark-click handlers for PersonalContentArea. */
export function usePersonalContentSelection(opts: {
  editing: boolean;
  readOnly: boolean;
  clipMode: boolean;
  eraseMode: boolean;
  guestLocked: boolean;
  highlights: UserContentHighlight[];
  containerRef: MutableRefObject<HTMLDivElement | null>;
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
    containerRef,
    selectionRef,
    highlightModeRef,
    preferredColorRef,
    saveHighlightRef,
    setSelection,
    setActiveHighlight,
    onGuestLockedClick,
    removeHighlightNow,
  } = opts;

  const selectGenRef = useRef(0);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);

  const handleMouseUp = useCallback(() => {
    if (editing || readOnly || clipMode || eraseMode) return;
    const gen = ++selectGenRef.current;
    const container = containerRef.current;
    const contentRoot =
      (container?.querySelector(".personal-content") as HTMLElement | null) ??
      container;
    const sel = window.getSelection();
    let snapshot: Range | null = null;
    if (
      contentRoot &&
      sel &&
      !sel.isCollapsed &&
      sel.rangeCount > 0 &&
      contentRoot.contains(sel.getRangeAt(0).commonAncestorContainer)
    ) {
      try {
        snapshot = sel.getRangeAt(0).cloneRange();
      } catch {
        snapshot = null;
      }
    }

    const finish = () => {
      if (gen !== selectGenRef.current) return;
      if (editing || readOnly || clipMode || eraseMode) return;
      const root =
        (containerRef.current?.querySelector(
          ".personal-content"
        ) as HTMLElement | null) ?? containerRef.current;
      if (!root) {
        if (gen === selectGenRef.current) {
          setSelection(null);
          selectionRef.current = null;
        }
        return;
      }
      const next = readArticleTextSelection(root, snapshot ?? undefined);
      if (!next) {
        if (gen === selectGenRef.current) {
          setSelection(null);
          selectionRef.current = null;
        }
        return;
      }
      selectionRef.current = next;
      setActiveHighlight(null);
      if (highlightModeRef.current) {
        const color = preferredColorRef.current;
        setSelection(null);
        saveHighlightRef.current?.(color);
        window.getSelection()?.removeAllRanges();
        return;
      }
      setSelection(next);
    };

    window.requestAnimationFrame(finish);
  }, [
    editing,
    readOnly,
    clipMode,
    eraseMode,
    containerRef,
    selectionRef,
    highlightModeRef,
    preferredColorRef,
    saveHighlightRef,
    setSelection,
    setActiveHighlight,
  ]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (clipMode) return;
      pointerDownRef.current = { x: e.clientX, y: e.clientY };
      setActiveHighlight(null);
      setSelection(null);
      selectionRef.current = null;
    },
    [clipMode, selectionRef, setActiveHighlight, setSelection]
  );

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
            (h) =>
              highlightRangeKey(h.startOffset, h.endOffset) === rangeAttr
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
