"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  positionPopover,
  type PopoverKind,
} from "@/lib/studyAiWorkspaceUtils";

/** Attach popover only — chat pin/rename/delete are inline on each row. */
export function useStudyAiPopovers() {
  const [popover, setPopover] = useState<PopoverKind>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const attachAnchorRef = useRef<HTMLElement | null>(null);

  const closePopover = useCallback(() => {
    setPopover(null);
    attachAnchorRef.current = null;
  }, []);

  const openPopover = useCallback(
    (kind: PopoverKind, anchor: HTMLElement) => {
      if (kind !== "attach") return;
      setPopover(kind);
      attachAnchorRef.current = anchor;
    },
    []
  );

  useLayoutEffect(() => {
    if (popover !== "attach") return;
    const menu = attachMenuRef.current;
    const anchor = attachAnchorRef.current;
    if (!menu || !anchor) return;
    positionPopover(menu, anchor);
  }, [popover]);

  useEffect(() => {
    if (popover === null) return;
    const onDocClick = () => closePopover();
    const timer = window.setTimeout(() => {
      document.addEventListener("click", onDocClick);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", onDocClick);
    };
  }, [popover, closePopover]);

  return {
    popover,
    attachMenuRef,
    closePopover,
    openPopover,
  };
}
