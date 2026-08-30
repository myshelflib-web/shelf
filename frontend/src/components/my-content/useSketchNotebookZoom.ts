"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { clampPdfScale } from "@/lib/pdfZoom";
import { usePdfWheelZoom } from "./usePdfWheelZoom";

export type SketchZoomCommands = {
  zoomIn: () => void;
  zoomOut: () => void;
};

/**
 * Notebook zoom: same pinch / Ctrl+scroll / toolbar path as PDFs.
 * Pencil strokes and two-finger pan stay on the ink hooks.
 */
export function useSketchNotebookZoom(opts: {
  viewport: HTMLElement | null;
  initialScale?: number;
  initialScrollTop?: number;
  initialScrollLeft?: number;
  onViewStateChange?: (state: {
    scrollTop: number;
    scrollLeft: number;
    scale: number;
  }) => void;
  commandsRef?: MutableRefObject<SketchZoomCommands | null>;
}): { scale: number; zoomBy: (delta: number) => void } {
  const [scale, setScale] = useState(() =>
    clampPdfScale(opts.initialScale ?? 1)
  );
  const zoomBy = usePdfWheelZoom(opts.viewport, scale, setScale);
  const restoredScroll = useRef(false);
  const onViewRef = useRef(opts.onViewStateChange);
  onViewRef.current = opts.onViewStateChange;
  const initialTop = opts.initialScrollTop;
  const initialLeft = opts.initialScrollLeft;

  useLayoutEffect(() => {
    const vp = opts.viewport;
    if (!vp || restoredScroll.current) return;
    restoredScroll.current = true;
    if (typeof initialTop === "number" && initialTop > 0) vp.scrollTop = initialTop;
    if (typeof initialLeft === "number" && initialLeft > 0) {
      vp.scrollLeft = initialLeft;
    }
  }, [opts.viewport, initialTop, initialLeft]);

  useEffect(() => {
    if (!restoredScroll.current) return;
    const vp = opts.viewport;
    if (!vp) return;
    onViewRef.current?.({
      scrollTop: vp.scrollTop,
      scrollLeft: vp.scrollLeft,
      scale,
    });
  }, [scale, opts.viewport]);

  useEffect(() => {
    const ref = opts.commandsRef;
    if (!ref) return;
    ref.current = {
      zoomIn: () => zoomBy(0.15),
      zoomOut: () => zoomBy(-0.15),
    };
    return () => {
      ref.current = null;
    };
  }, [opts.commandsRef, zoomBy]);

  return { scale, zoomBy };
}
