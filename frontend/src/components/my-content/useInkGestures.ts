"use client";

import { useCallback, useEffect, useRef } from "react";

type Point = { x: number; y: number };

/** Ignore Apple Pencil's companion touch events — those are ink, not gestures. */
function fingerTouches(touches: TouchList): Touch[] {
  const fingers: Touch[] = [];
  for (let i = 0; i < touches.length; i++) {
    const touch = touches[i]!;
    const kind = (touch as Touch & { touchType?: string }).touchType;
    if (kind === "stylus" || kind === "pen") continue;
    fingers.push(touch);
  }
  return fingers;
}

function centreOf(fingers: Touch[]): Point {
  const used = Math.min(fingers.length, 2);
  let x = 0;
  let y = 0;
  for (let i = 0; i < used; i++) {
    x += fingers[i]!.clientX;
    y += fingers[i]!.clientY;
  }
  return { x: x / used, y: y / used };
}

/**
 * While a drawing tool is active, native one-finger pan is off (`touch-action:
 * none` via `data-ink-mode`). This hook only adds two-finger scroll in JS and
 * pins the scroll offset for the duration of an active stroke.
 *
 * Deliberately does not interrupt strokes, track stylus sessions, or cancel
 * palm contacts — those caused accidental taps on highlights/tabs.
 */
export function useInkGestures(scrollRoot: HTMLElement | null, inkActive: boolean) {
  const rootRef = useRef<HTMLElement | null>(scrollRoot);
  rootRef.current = scrollRoot;
  const lockRef = useRef<Point | null>(null);

  const setInkDrawing = useCallback((active: boolean) => {
    const root = rootRef.current;
    if (!root) return;
    if (active) {
      root.dataset.inkDrawing = "1";
      lockRef.current = { x: root.scrollLeft, y: root.scrollTop };
    } else {
      delete root.dataset.inkDrawing;
      lockRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!scrollRoot) return;
    const restore = () => {
      const lock = lockRef.current;
      if (!lock) return;
      if (scrollRoot.scrollTop !== lock.y) scrollRoot.scrollTop = lock.y;
      if (scrollRoot.scrollLeft !== lock.x) scrollRoot.scrollLeft = lock.x;
    };
    scrollRoot.addEventListener("scroll", restore, { passive: true });
    return () => scrollRoot.removeEventListener("scroll", restore);
  }, [scrollRoot]);

  useEffect(() => {
    if (!scrollRoot) return;
    if (!inkActive) {
      delete scrollRoot.dataset.inkMode;
      return;
    }
    scrollRoot.dataset.inkMode = "1";

    let last: Point | null = null;

    const onTouchStart = (e: TouchEvent) => {
      const fingers = fingerTouches(e.touches);
      last = fingers.length >= 2 ? centreOf(fingers) : null;
    };

    const onTouchMove = (e: TouchEvent) => {
      // Never pan while a stroke is in progress.
      if (lockRef.current) return;
      const fingers = fingerTouches(e.touches);
      if (fingers.length < 2) {
        last = null;
        return;
      }
      const centre = centreOf(fingers);
      if (last) {
        scrollRoot.scrollTop -= centre.y - last.y;
        scrollRoot.scrollLeft -= centre.x - last.x;
      }
      last = centre;
      if (e.cancelable) e.preventDefault();
    };

    const onTouchEnd = (e: TouchEvent) => {
      const fingers = fingerTouches(e.touches);
      last = fingers.length >= 2 ? centreOf(fingers) : null;
    };

    scrollRoot.addEventListener("touchstart", onTouchStart, { passive: true });
    scrollRoot.addEventListener("touchmove", onTouchMove, { passive: false });
    scrollRoot.addEventListener("touchend", onTouchEnd, { passive: true });
    scrollRoot.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      scrollRoot.removeEventListener("touchstart", onTouchStart);
      scrollRoot.removeEventListener("touchmove", onTouchMove);
      scrollRoot.removeEventListener("touchend", onTouchEnd);
      scrollRoot.removeEventListener("touchcancel", onTouchEnd);
      delete scrollRoot.dataset.inkMode;
    };
  }, [scrollRoot, inkActive]);

  return setInkDrawing;
}
