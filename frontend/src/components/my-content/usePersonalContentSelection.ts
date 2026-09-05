"use client";

import { useCallback, useEffect, type MutableRefObject } from "react";
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
    onTextPick,
    onClearPick,
  } = opts;

  const enabled = !editing && !readOnly && !clipMode && !eraseMode && !highlightMode;

  const capturePick = useCallback(() => {
    if (!enabled) return;
    const root = contentRootRef.current;
    const origin = originRef.current;
    if (!root || !origin) return;
    const next = captureHtmlTextSelection(root, origin);
    if (!next) {
      onClearPick();
      return;
    }
    onTextPick(next);
  }, [enabled, contentRootRef, originRef, onTextPick, onClearPick]);

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

  return { handleMouseUp: capturePick };
}
