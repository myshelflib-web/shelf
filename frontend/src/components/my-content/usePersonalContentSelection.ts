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

/** Pointer tool: keep the native selection and open the color menu. */
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
    if (!enabled) return;
    const root = contentRootRef.current;
    const origin = originRef.current;
    if (!root || !origin) return;
    const next = captureHtmlTextSelection(root, origin);
    if (!next) {
      // Sticky: keep an armed popup pick until explicit close/save/ask/note.
      if (selectionRef.current) return;
      onClearPickRef.current();
      return;
    }
    onTextPickRef.current(next);
  }, [enabled, contentRootRef, originRef, selectionRef]);

  useEffect(() => {
    if (!enabled) return;
    const onUp = (e: PointerEvent) => {
      if (isHtmlSelectionChromeTarget(e.target)) return;
      // Defer past capture-phase toolbar dismiss so a just-finished
      // selection is still present when we open the color menu.
      window.requestAnimationFrame(capturePick);
    };
    document.addEventListener("pointerup", onUp);
    return () => document.removeEventListener("pointerup", onUp);
  }, [enabled, capturePick]);

  // Keyboard / slow-drag selections: open the menu when the range settles.
  useEffect(() => {
    if (!enabled) return;
    let timer: number | null = null;
    const onChange = () => {
      if (timer != null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        const root = contentRootRef.current;
        const sel = window.getSelection();
        if (!root || !sel || sel.isCollapsed || sel.rangeCount < 1) return;
        const node = sel.anchorNode;
        if (!node || !root.contains(node)) return;
        capturePick();
      }, 120);
    };
    document.addEventListener("selectionchange", onChange);
    return () => {
      if (timer != null) window.clearTimeout(timer);
      document.removeEventListener("selectionchange", onChange);
    };
  }, [enabled, capturePick, contentRootRef]);

  return { handleMouseUp: capturePick };
}
