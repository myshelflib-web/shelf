"use client";

import { useRef, type CSSProperties, type RefObject } from "react";

export type PenCursorHandle = {
  ref: RefObject<HTMLDivElement | null>;
  move: (clientX: number, clientY: number) => void;
  hide: () => void;
};

/**
 * Follow the pointer imperatively.
 *
 * Holding the cursor position in state re-renders the whole viewer on every
 * pointer move, and a stylus reports far faster than React can keep up with —
 * the stroke then lags behind the nib and loses samples.
 */
export function usePenCursor(): PenCursorHandle {
  const ref = useRef<HTMLDivElement>(null);
  const move = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = `translate(${clientX}px, ${clientY}px) translate(-50%, -50%)`;
    el.style.opacity = "1";
  };
  const hide = () => {
    const el = ref.current;
    if (el) el.style.opacity = "0";
  };
  return { ref, move, hide };
}

export function PenCursor({
  handle,
  kind,
  size,
  color,
}: {
  handle: PenCursorHandle;
  kind: "pen" | "ink" | "erase";
  size?: number;
  color?: string;
}) {
  const style: CSSProperties =
    kind === "erase"
      ? {
          width: 22,
          height: 22,
          border: "1.5px solid var(--text-primary)",
          background: "transparent",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.35)",
        }
      : {
          width: size,
          height: size,
          background: color,
          mixBlendMode: kind === "pen" ? "multiply" : undefined,
          boxShadow:
            kind === "pen"
              ? "0 0 0 1px rgba(0,0,0,0.08)"
              : "0 0 0 1px rgba(0,0,0,0.2)",
        };
  return (
    <div
      ref={handle.ref}
      className="fixed left-0 top-0 z-[80] rounded-full pointer-events-none opacity-0"
      style={style}
      aria-hidden
    />
  );
}
