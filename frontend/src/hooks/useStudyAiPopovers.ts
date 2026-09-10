"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  positionPopover,
  type PopoverKind,
} from "@/lib/studyAiWorkspaceUtils";

export function useStudyAiPopovers() {
  const [popover, setPopover] = useState<PopoverKind>(null);
  const [chatMenuThreadId, setChatMenuThreadId] = useState<string | null>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const chatMenuRef = useRef<HTMLDivElement>(null);
  const chatMenuAnchorRef = useRef<HTMLElement | null>(null);

  const closePopover = useCallback(() => {
    setPopover(null);
    setChatMenuThreadId(null);
    chatMenuAnchorRef.current = null;
  }, []);

  const openPopover = useCallback(
    (kind: PopoverKind, anchor: HTMLElement, menuThreadId?: string) => {
      setPopover(kind);
      if (menuThreadId) setChatMenuThreadId(menuThreadId);
      chatMenuAnchorRef.current = anchor;
    },
    []
  );

  useLayoutEffect(() => {
    if (popover === null) return;
    const menu =
      popover === "attach" ? attachMenuRef.current : chatMenuRef.current;
    const anchor = chatMenuAnchorRef.current;
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
    chatMenuThreadId,
    attachMenuRef,
    chatMenuRef,
    closePopover,
    openPopover,
  };
}
