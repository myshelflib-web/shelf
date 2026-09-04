"use client";

import {
  useCallback,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type { UserContentHighlight } from "@/types";
import {
  captureHtmlTextSelection,
  type HtmlTextPick,
} from "./htmlPageSelection";

type ActiveHighlight = {
  highlight: UserContentHighlight;
  rect: DOMRect;
};

/** PDF text-tool mouseup: read the native selection, then show the color menu. */
export function usePersonalContentSelection(opts: {
  editing: boolean;
  readOnly: boolean;
  clipMode: boolean;
  eraseMode: boolean;
  highlightMode: boolean;
  contentRootRef: MutableRefObject<HTMLElement | null>;
  originRef: MutableRefObject<HTMLElement | null>;
  selectionRef: MutableRefObject<HtmlTextPick | null>;
  setSelection: Dispatch<SetStateAction<HtmlTextPick | null>>;
  setActiveHighlight: Dispatch<SetStateAction<ActiveHighlight | null>>;
}) {
  const {
    editing,
    readOnly,
    clipMode,
    eraseMode,
    highlightMode,
    contentRootRef,
    originRef,
    selectionRef,
    setSelection,
    setActiveHighlight,
  } = opts;

  const handleMouseUp = useCallback(() => {
    if (editing || readOnly || clipMode || eraseMode || highlightMode) return;
    const root = contentRootRef.current;
    const origin = originRef.current;
    if (!root || !origin) return;
    const next = captureHtmlTextSelection(root, origin);
    if (!next) return;
    selectionRef.current = next;
    setActiveHighlight(null);
    setSelection(next);
  }, [
    editing,
    readOnly,
    clipMode,
    eraseMode,
    highlightMode,
    contentRootRef,
    originRef,
    selectionRef,
    setSelection,
    setActiveHighlight,
  ]);

  return { handleMouseUp };
}
