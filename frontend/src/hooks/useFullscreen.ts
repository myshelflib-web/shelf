"use client";

import { RefObject, useCallback, useEffect, useState } from "react";

const FS_CLASS = "shelf-doc-fullscreen";

function nativeFullscreenElement(): Element | null {
  if (typeof document === "undefined") return null;
  return document.fullscreenElement;
}

function canUseNativeFullscreen(): boolean {
  return (
    typeof document !== "undefined" && Boolean(document.fullscreenEnabled)
  );
}

export function useFullscreen(targetRef: RefObject<HTMLElement | null>) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => {
      const el = targetRef.current;
      if (!el) {
        setIsFullscreen(false);
        return;
      }
      setIsFullscreen(
        nativeFullscreenElement() === el || el.classList.contains(FS_CLASS)
      );
    };
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, [targetRef]);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const el = targetRef.current;
      if (!el?.classList.contains(FS_CLASS)) return;
      el.classList.remove(FS_CLASS);
      setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [isFullscreen, targetRef]);

  const toggle = useCallback(async () => {
    const el = targetRef.current;
    if (!el) return;

    const exitPseudo = () => {
      el.classList.remove(FS_CLASS);
      setIsFullscreen(false);
    };
    const enterPseudo = () => {
      el.classList.add(FS_CLASS);
      setIsFullscreen(true);
    };

    try {
      if (nativeFullscreenElement() === el) {
        await document.exitFullscreen();
        return;
      }
      if (el.classList.contains(FS_CLASS)) {
        exitPseudo();
        return;
      }
      if (nativeFullscreenElement()) {
        await document.exitFullscreen();
      }
      if (canUseNativeFullscreen()) {
        try {
          await el.requestFullscreen();
          return;
        } catch {
          /* fall through to layout fullscreen */
        }
      }
      enterPseudo();
    } catch {
      enterPseudo();
    }
  }, [targetRef]);

  return {
    isFullscreen,
    toggle,
    /** Always true — native API or CSS layout fullscreen. */
    supported: true,
  };
}
