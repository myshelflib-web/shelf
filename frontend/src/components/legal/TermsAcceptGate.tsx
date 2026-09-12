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

export const TERMS_ACCEPT_HINT =
  "Please accept the Terms of Service and Privacy Policy first";

/** Returns false when terms are not accepted and flashes a tooltip. */
export function useTermsAcceptGate(agreed: boolean) {
  const [hintOpen, setHintOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showHint = useCallback(() => {
    setHintOpen(true);
    clearTimer();
    timerRef.current = window.setTimeout(() => setHintOpen(false), 3200);
  }, [clearTimer]);

  const requireAccepted = useCallback(() => {
    if (agreed) {
      setHintOpen(false);
      return true;
    }
    showHint();
    return false;
  }, [agreed, showHint]);

  useEffect(() => {
    if (agreed) setHintOpen(false);
  }, [agreed]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return { hintOpen, requireAccepted, showHint };
}

/** Click/forced tooltip anchored to children (same visual language as ShelfTooltip). */
export function TermsAcceptTooltip({
  open,
  text = TERMS_ACCEPT_HINT,
  side = "top",
  className,
  children,
}: {
  open: boolean;
  text?: string;
  side?: "top" | "bottom";
  className?: string;
  children: ReactNode;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({
        top: side === "top" ? r.top - 8 : r.bottom + 8,
        left: r.left + r.width / 2,
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, side]);

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
              "pointer-events-none fixed z-[220] w-max max-w-[16rem] px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[11px] leading-snug text-[var(--text-secondary)] shadow-lg text-center"
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
    <span ref={anchorRef} className={clsx("relative block w-full", className)}>
      {children}
      {tip}
    </span>
  );
}

/** Invisible overlay that blocks social widget clicks until terms are accepted. */
export function TermsAcceptClickCatcher({
  active,
  onBlocked,
}: {
  active: boolean;
  onBlocked: () => void;
}) {
  if (!active) return null;
  return (
    <button
      type="button"
      className="absolute inset-0 z-20 rounded-lg cursor-pointer"
      aria-label={TERMS_ACCEPT_HINT}
      onClick={onBlocked}
    />
  );
}
