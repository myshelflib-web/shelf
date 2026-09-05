"use client";

import { useCallback, type MutableRefObject } from "react";
import {
  captureHtmlTextSelection,
  type HtmlTextPick,
} from "./htmlPageSelection";

/** PDF text-tool mouseup: capture the native selection, then apply it. */
export function usePersonalContentSelection(opts: {
  editing: boolean;
  readOnly: boolean;
  clipMode: boolean;
  eraseMode: boolean;
  highlightMode: boolean;
  contentRootRef: MutableRefObject<HTMLElement | null>;
  originRef: MutableRefObject<HTMLElement | null>;
  onTextPick: (pick: HtmlTextPick) => void;
}) {
  const {
    editing,
    readOnly,
    clipMode,
    eraseMode,
    highlightMode,
    contentRootRef,
    originRef,
    onTextPick,
  } = opts;

  const handleMouseUp = useCallback(() => {
    if (editing || readOnly || clipMode || eraseMode || highlightMode) return;
    const root = contentRootRef.current;
    const origin = originRef.current;
    if (!root || !origin) return;
    const next = captureHtmlTextSelection(root, origin);
    if (!next) return;
    onTextPick(next);
  }, [
    editing,
    readOnly,
    clipMode,
    eraseMode,
    highlightMode,
    contentRootRef,
    originRef,
    onTextPick,
  ]);

  return { handleMouseUp };
}
