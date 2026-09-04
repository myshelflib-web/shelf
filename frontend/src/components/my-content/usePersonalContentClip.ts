"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { captureViewportRect } from "@/lib/captureTab";

type ClipBox = { x: number; y: number; w: number; h: number };

/** Region-clip drag handlers for PersonalContentArea (move-only extract). */
export function usePersonalContentClip(
  clipMode: boolean,
  onClip?: (imageDataUrl: string) => void
) {
  const clipDrag = useRef<{
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  } | null>(null);
  const [clipBox, setClipBox] = useState<ClipBox | null>(null);

  useEffect(() => {
    if (!clipMode || !onClip) return;
    const onPaste = async (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items ?? [])].find((i) =>
        i.type.startsWith("image/")
      );
      const file = item?.getAsFile();
      if (!file) return;
      e.preventDefault();
      const reader = new FileReader();
      reader.onload = () => onClip(String(reader.result));
      reader.readAsDataURL(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [clipMode, onClip]);

  useEffect(() => {
    if (!clipMode) {
      clipDrag.current = null;
      setClipBox(null);
    }
  }, [clipMode]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!clipMode) return;
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left + el.scrollLeft;
      const y = e.clientY - r.top + el.scrollTop;
      clipDrag.current = { x0: x, y0: y, x1: x, y1: y };
      setClipBox({ x, y, w: 0, h: 0 });
      el.setPointerCapture(e.pointerId);
    },
    [clipMode]
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!clipMode || !clipDrag.current) return;
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      clipDrag.current.x1 = e.clientX - r.left + el.scrollLeft;
      clipDrag.current.y1 = e.clientY - r.top + el.scrollTop;
      const { x0, y0, x1, y1 } = clipDrag.current;
      setClipBox({
        x: Math.min(x0, x1),
        y: Math.min(y0, y1),
        w: Math.abs(x1 - x0),
        h: Math.abs(y1 - y0),
      });
    },
    [clipMode]
  );

  const onPointerUp = useCallback(
    async (e: ReactPointerEvent<HTMLElement>) => {
      if (!clipMode) return;
      const drag = clipDrag.current;
      clipDrag.current = null;
      setClipBox(null);
      const el = e.currentTarget;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (!drag || !onClip) return;
      const w = Math.abs(drag.x1 - drag.x0);
      const h = Math.abs(drag.y1 - drag.y0);
      if (w < 12 || h < 12) return;
      const r = el.getBoundingClientRect();
      const left = r.left + Math.min(drag.x0, drag.x1) - el.scrollLeft;
      const top = r.top + Math.min(drag.y0, drag.y1) - el.scrollTop;
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );
      try {
        const data = await captureViewportRect({
          left,
          top,
          width: w,
          height: h,
        });
        if (data) onClip(data);
      } catch {
        /* capture cancelled or unsupported */
      }
    },
    [clipMode, onClip]
  );

  return { clipBox, onPointerDown, onPointerMove, onPointerUp };
}
