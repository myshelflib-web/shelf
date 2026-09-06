"use client";

import { useCallback, useEffect, useRef, type MutableRefObject } from "react";
import {
  captureHtmlTextSelection,
  type HtmlTextPick,
} from "./htmlPageSelection";

const HTML_SELECTION_CHROME =
  ".editor-toolbar-row, .highlight-menu, [data-shelf-tool-popover], [role='dialog']";

export function isHtmlSelectionChromeTarget(target: EventTarget | null): boolean {
  const el = target as { closest?: (s: string) => unknown } | null;
  if (!el || typeof el.closest !== "function") return false;
  return Boolean(el.closest(HTML_SELECTION_CHROME));
}

/** Freeze native selection into a pick and open the color menu. */
export function usePersonalContentSelection(opts: {
  editing: boolean;
  readOnly: boolean;
  clipMode: boolean;
  eraseMode: boolean;
  highlightMode?: boolean;
  contentRootRef: MutableRefObject<HTMLElement | null>;
  originRef: MutableRefObject<HTMLElement | null>;
  /** Armed pick while the popup is open — empty captures must not wipe this. */
  selectionRef: MutableRefObject<HtmlTextPick | null>;
  onTextPick: (pick: HtmlTextPick) => void;
  onClearPick: () => void;
}) {
  const {
    editing,
    readOnly,
    clipMode,
    eraseMode,
    highlightMode = false,
    contentRootRef,
    originRef,
    selectionRef,
    onTextPick,
    onClearPick,
  } = opts;

  const enabled = !editing && !readOnly && !clipMode && !eraseMode && !highlightMode;

  const onTextPickRef = useRef(onTextPick);
  onTextPickRef.current = onTextPick;
  const onClearPickRef = useRef(onClearPick);
  onClearPickRef.current = onClearPick;

  const capturePick = useCallback(() => {
    if (!enabled) return false;
    const root = contentRootRef.current;
    const origin = originRef.current;
    if (!root || !origin) return false;
    const next = captureHtmlTextSelection(root, origin);
    if (!next) return false;
    onTextPickRef.current(next);
    return true;
  }, [enabled, contentRootRef, originRef]);

  useEffect(() => {
    if (!enabled) return;

    const scheduleCapture = () => {
      // Two frames: past capture-phase toolbar dismiss + layout.
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          if (capturePick()) return;
          // Sticky: keep an armed popup pick until explicit close/save/ask/note.
          if (selectionRef.current) return;
          onClearPickRef.current();
        });
      });
    };

    const onUp = (e: PointerEvent) => {
      if (isHtmlSelectionChromeTarget(e.target)) return;
      scheduleCapture();
    };

    // Keyboard / slow-drag: open when the range settles inside the article.
    let changeTimer: number | null = null;
    const onChange = () => {
      if (changeTimer != null) window.clearTimeout(changeTimer);
      changeTimer = window.setTimeout(() => {
        changeTimer = null;
        const root = contentRootRef.current;
        const sel = window.getSelection();
        if (!root || !sel || sel.isCollapsed || sel.rangeCount < 1) return;
        const node = sel.anchorNode;
        if (!node || !root.contains(node)) return;
        capturePick();
      }, 160);
    };

    document.addEventListener("pointerup", onUp);
    document.addEventListener("selectionchange", onChange);
    return () => {
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("selectionchange", onChange);
      if (changeTimer != null) window.clearTimeout(changeTimer);
    };
  }, [enabled, capturePick, contentRootRef, selectionRef]);

  return { handleMouseUp: capturePick };
}
