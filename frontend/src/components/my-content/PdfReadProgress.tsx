"use client";

import { useEffect, useRef, useState } from "react";
import { pdfReadPercent } from "@/lib/pdfLayout";
import { ReadProgressBar } from "./ReadProgressBar";

/** Scroll-synced read percent — no UI; keeps PdfViewer from re-rendering on scroll. */
export function usePdfReadProgressSync(
  scrollRoot: HTMLElement | null,
  active: boolean,
  onReadProgress?: (percent: number) => void
): number {
  const [pct, setPct] = useState(0);
  const onReadProgressRef = useRef(onReadProgress);
  onReadProgressRef.current = onReadProgress;
  const lastPctRef = useRef(-1);

  useEffect(() => {
    if (!scrollRoot || !active) return;
    let raf = 0;
    const sync = () => {
      const percent = pdfReadPercent(
        scrollRoot.scrollTop,
        scrollRoot.scrollHeight,
        scrollRoot.clientHeight
      );
      if (percent === lastPctRef.current) return;
      lastPctRef.current = percent;
      setPct(percent);
      onReadProgressRef.current?.(percent);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        sync();
      });
    };
    scrollRoot.addEventListener("scroll", onScroll, { passive: true });
    sync();
    return () => {
      scrollRoot.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [scrollRoot, active]);

  return pct;
}

/** Scroll-synced progress bar — isolated so PdfViewer does not re-render on scroll. */
export function PdfReadProgress({
  scrollRoot,
  active = true,
  onReadProgress,
  className,
}: {
  scrollRoot: HTMLElement | null;
  active?: boolean;
  onReadProgress?: (percent: number) => void;
  className?: string;
}) {
  const pct = usePdfReadProgressSync(scrollRoot, active, onReadProgress);
  return (
    <ReadProgressBar
      percent={pct}
      className={className ?? "justify-self-center"}
    />
  );
}
