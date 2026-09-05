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
    contentRootRef,
    originRef,
    onTextPick,
    onClearPick,
  } = opts;

  const handleMouseUp = useCallback(() => {
    if (editing || readOnly || clipMode || eraseMode) return;
    const root = contentRootRef.current;
    const origin = originRef.current;
    if (!root || !origin) return;
    const next = captureHtmlTextSelection(root, origin);
    if (!next) {
      onClearPick();
      return;
    }
    onTextPick(next);
  }, [
    editing,
    readOnly,
    clipMode,
    eraseMode,
    contentRootRef,
    originRef,
    onTextPick,
    onClearPick,
  ]);

  return { handleMouseUp };
}
