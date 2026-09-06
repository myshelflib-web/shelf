"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";

/**
 * App-styled hover tip (InfoTip tokens) portaled so toolbar overflow
 * does not clip it.
 */
export function ShelfTooltip({
  text,
  side = "bottom",
  className,
  children,
}: {
  text: string;
  side?: "top" | "bottom";
  className?: string;
  children: ReactNode;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const place = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      top: side === "top" ? r.top - 8 : r.bottom + 8,
      left: r.left + r.width / 2,
    });
  }, [side]);

  useEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  const portalRoot =
    typeof document !== "undefined"
      ? document.fullscreenElement instanceof HTMLElement
        ? document.fullscreenElement
        : document.body
      : null;

  const tip =
    open && pos && portalRoot
      ? createPortal(
          <span
            role="tooltip"
            className={clsx(
              "pointer-events-none fixed z-[220] w-max max-w-[14rem] px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[11px] leading-snug text-[var(--text-secondary)] shadow-lg text-center"
            )}
            style={{
              top: pos.top,
              left: pos.left,
              transform:
                side === "top" ? "translate(-50%, -100%)" : "translateX(-50%)",
            }}
          >
            {text}
          </span>,
          portalRoot
        )
      : null;

  return (
    <span
      ref={anchorRef}
      className={clsx("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      {children}
      {tip}
    </span>
  );
}
