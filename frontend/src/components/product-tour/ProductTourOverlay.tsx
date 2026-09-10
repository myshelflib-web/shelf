"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { X } from "lucide-react";
import type { TourStep } from "@/lib/productTour/steps";

const PAD = 8;
const CARD_GAP = 12;
const WAIT_MS = 1500;
const POLL_MS = 100;

type Rect = { top: number; left: number; width: number; height: number };

function readTargetRect(targetId: string): Rect | null {
  const el = document.querySelector(
    `[data-tour-id="${CSS.escape(targetId)}"]`
  ) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 1 && r.height < 1) return null;
  return {
    top: r.top,
    left: r.left,
    width: r.width,
    height: r.height,
  };
}

function placeCard(
  target: Rect,
  cardW: number,
  cardH: number,
  placement: TourStep["placement"]
): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const prefer = placement && placement !== "auto" ? placement : "bottom";

  const candidates: Record<string, { top: number; left: number }> = {
    bottom: {
      top: target.top + target.height + CARD_GAP,
      left: target.left + target.width / 2 - cardW / 2,
    },
    top: {
      top: target.top - cardH - CARD_GAP,
      left: target.left + target.width / 2 - cardW / 2,
    },
    left: {
      top: target.top + target.height / 2 - cardH / 2,
      left: target.left - cardW - CARD_GAP,
    },
    right: {
      top: target.top + target.height / 2 - cardH / 2,
      left: target.left + target.width + CARD_GAP,
    },
  };

  const order =
    prefer === "top"
      ? ["top", "bottom", "right", "left"]
      : prefer === "left"
        ? ["left", "right", "bottom", "top"]
        : prefer === "right"
          ? ["right", "left", "bottom", "top"]
          : ["bottom", "top", "right", "left"];

  for (const key of order) {
    const c = candidates[key];
    if (
      c.top >= 8 &&
      c.left >= 8 &&
      c.top + cardH <= vh - 8 &&
      c.left + cardW <= vw - 8
    ) {
      return c;
    }
  }

  return {
    top: Math.min(Math.max(8, candidates.bottom.top), vh - cardH - 8),
    left: Math.min(Math.max(8, candidates.bottom.left), vw - cardW - 8),
  };
}

export function ProductTourOverlay({
  steps,
  stepIndex,
  onNext,
  onSkipAll,
}: {
  steps: TourStep[];
  stepIndex: number;
  onNext: () => void;
  onSkipAll: () => void;
}) {
  const step = steps[stepIndex];
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(
    null
  );
  const [waiting, setWaiting] = useState(true);

  const measure = useCallback(() => {
    if (!step) return null;
    return readTargetRect(step.targetId);
  }, [step]);

  useEffect(() => {
    if (!step) return;
    setWaiting(true);
    setRect(null);
    setCardPos(null);

    const started = Date.now();
    let cancelled = false;
    let timer: number | null = null;

    const tick = () => {
      if (cancelled) return;
      const r = measure();
      if (r) {
        const el = document.querySelector(
          `[data-tour-id="${CSS.escape(step.targetId)}"]`
        ) as HTMLElement | null;
        el?.scrollIntoView({ block: "nearest", inline: "nearest" });
        const after = measure() ?? r;
        setRect(after);
        setWaiting(false);
        return;
      }
      if (Date.now() - started >= WAIT_MS) {
        setWaiting(false);
        onNext();
        return;
      }
      timer = window.setTimeout(tick, POLL_MS);
    };

    tick();
    return () => {
      cancelled = true;
      if (timer != null) window.clearTimeout(timer);
    };
  }, [step, measure, onNext]);

  useLayoutEffect(() => {
    if (!rect || !step) return;
    const card = document.getElementById("shelf-product-tour-card");
    const cardW = card?.offsetWidth ?? 320;
    const cardH = card?.offsetHeight ?? 140;
    setCardPos(placeCard(rect, cardW, cardH, step.placement));
  }, [rect, step]);

  useEffect(() => {
    if (!rect) return;
    const onResize = () => {
      const r = measure();
      if (r) setRect(r);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [rect, measure]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onSkipAll();
      } else if (e.key === "Enter" || e.key === "ArrowRight") {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNext, onSkipAll]);

  if (!step || waiting || !rect) return null;

  const hole = {
    top: Math.max(0, rect.top - PAD),
    left: Math.max(0, rect.left - PAD),
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };

  const isLast = stepIndex >= steps.length - 1;

  return (
    <div
      className="fixed inset-0 z-[90]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shelf-product-tour-title"
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <mask id="shelf-tour-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={hole.left}
              y={hole.top}
              width={hole.width}
              height={hole.height}
              rx={10}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.55)"
          mask="url(#shelf-tour-mask)"
          className="pointer-events-auto"
          onClick={onSkipAll}
        />
      </svg>

      <div
        className="pointer-events-none absolute rounded-[10px] ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-transparent"
        style={{
          top: hole.top,
          left: hole.left,
          width: hole.width,
          height: hole.height,
        }}
        aria-hidden
      />

      <div
        id="shelf-product-tour-card"
        className="pointer-events-auto absolute z-[91] w-[min(20rem,calc(100vw-1.5rem))] rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 shadow-lg"
        style={{
          top: cardPos?.top ?? hole.top + hole.height + CARD_GAP,
          left: cardPos?.left ?? Math.max(8, hole.left),
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {stepIndex + 1} of {steps.length}
            </p>
            <h2
              id="shelf-product-tour-title"
              className="mt-1 text-sm font-semibold text-[var(--text-primary)]"
            >
              {step.title}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
              {step.body}
            </p>
          </div>
          <button
            type="button"
            aria-label="Skip tour"
            className="shrink-0 rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            onClick={onSkipAll}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            onClick={onSkipAll}
          >
            Skip all
          </button>
          <button
            type="button"
            className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            onClick={onNext}
          >
            {isLast ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
