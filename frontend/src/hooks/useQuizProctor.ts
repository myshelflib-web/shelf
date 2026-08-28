"use client";

import { useCallback, useEffect, useRef } from "react";
import { QUIZ_PROCTOR_ATTR } from "@/lib/hotkeys";

export type QuizProctorReason = "tab" | "fullscreen";

const FS_CLASS = "shelf-doc-fullscreen";

export function useQuizProctor({
  active,
  onViolation,
}: {
  active: boolean;
  onViolation: (reason: QuizProctorReason) => void;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const skipHideRef = useRef(false);
  const skipFsRef = useRef(false);
  const endedRef = useRef(false);
  const onViolationRef = useRef(onViolation);
  onViolationRef.current = onViolation;

  const release = useCallback(() => {
    endedRef.current = true;
  }, []);

  const violate = useCallback((reason: QuizProctorReason) => {
    if (endedRef.current) return;
    endedRef.current = true;
    onViolationRef.current(reason);
  }, []);

  const armFilePicker = useCallback(() => {
    skipHideRef.current = true;
    window.setTimeout(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        skipHideRef.current = false;
      }
    }, 2500);
  }, []);

  const enter = useCallback(async () => {
    const el = shellRef.current;
    if (!el) return false;
    endedRef.current = false;
    skipFsRef.current = true;
    if (typeof document !== "undefined" && document.fullscreenEnabled) {
      try {
        await el.requestFullscreen();
        skipFsRef.current = false;
        return true;
      } catch {
        /* layout fullscreen */
      }
    }
    el.classList.add(FS_CLASS);
    skipFsRef.current = false;
    return true;
  }, []);

  const exit = useCallback(async () => {
    skipFsRef.current = true;
    shellRef.current?.classList.remove(FS_CLASS);
    try {
      if (typeof document !== "undefined" && document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      /* already left */
    }
  }, []);

  useEffect(() => {
    if (!active) {
      document.documentElement.removeAttribute(QUIZ_PROCTOR_ATTR);
      return;
    }
    document.documentElement.setAttribute(QUIZ_PROCTOR_ATTR, "on");
    endedRef.current = false;

    const onVis = () => {
      if (!document.hidden) return;
      if (skipHideRef.current) {
        skipHideRef.current = false;
        return;
      }
      violate("tab");
    };
    const onFs = () => {
      if (skipFsRef.current) return;
      const el = shellRef.current;
      const native = document.fullscreenElement === el;
      const pseudo = Boolean(el?.classList.contains(FS_CLASS));
      if (!native && !pseudo) violate("fullscreen");
    };
    const onPageHide = () => violate("tab");
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const el = shellRef.current;
      if (!el?.classList.contains(FS_CLASS)) return;
      el.classList.remove(FS_CLASS);
      violate("fullscreen");
    };

    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("fullscreenchange", onFs);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.documentElement.removeAttribute(QUIZ_PROCTOR_ATTR);
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("fullscreenchange", onFs);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [active, violate]);

  return { shellRef, enter, exit, release, armFilePicker };
}
