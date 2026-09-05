"use client";

import { useCallback, type MutableRefObject } from "react";
import {
  captureHtmlTextSelection,
  type HtmlTextPick,
} from "./htmlPageSelection";

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

  const handleMouseUp = useCallback(() => {
    if (editing || readOnly || clipMode || eraseMode || highlightMode) return;
    // Defer past capture-phase toolbar dismiss handlers so a just-finished
    // selection is still present when we open the color menu.
    window.requestAnimationFrame(() => {
      if (editing || readOnly || clipMode || eraseMode || highlightMode) return;
      const root = contentRootRef.current;
      const origin = originRef.current;
      if (!root || !origin) return;
      const next = captureHtmlTextSelection(root, origin);
      if (!next) {
        onClearPick();
        return;
      }
      onTextPick(next);
    });
  }, [
    editing,
    readOnly,
    clipMode,
    eraseMode,
    highlightMode,
    contentRootRef,
    originRef,
    onTextPick,
    onClearPick,
  ]);

  return { handleMouseUp };
}
