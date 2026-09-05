"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FileText, Sparkles, Trash2, X } from "lucide-react";
import { withShortcut } from "@/lib/hotkeys";
import type { AnnotationGate } from "@/lib/preloadedReadOnly";
import { lockedFeatureLabel } from "@/lib/preloadedReadOnly";

/** Soft pastels matching the highlight menu reference */
export const HIGHLIGHT_COLORS = [
  { id: "yellow", hex: "#f0d66e" },
  { id: "green", hex: "#8fd4a8" },
  { id: "blue", hex: "#8ec5ea" },
  { id: "pink", hex: "#f0b8c8" },
  { id: "orange", hex: "#e8a07a" },
] as const;

interface HighlightToolbarProps {
  rect: DOMRect;
  onHighlight: (color: string) => void;
  onAsk?: () => void;
  onNote?: () => void;
  /** When set, shows trash to delete the highlight */
  onRemove?: () => void;
  onClose: () => void;
  showColors?: boolean;
  /** Account-only — controls stay visible but muted; clicks call onLockedClick. */
  locked?: boolean;
  lockedGate?: AnnotationGate | null;
  onLockedClick?: (feature: string) => void;
}

export function HighlightToolbar({
  rect,
  onHighlight,
  onAsk,
  onNote,
  onRemove,
  onClose,
  showColors = true,
  locked = false,
  lockedGate = null,
  onLockedClick,
}: HighlightToolbarProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    // Arm after mount so the opening gesture cannot instantly dismiss.
    let armed = false;
    const armTimer = window.setTimeout(() => {
      armed = true;
    }, 120);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };

    // Dismiss only for true chrome/backdrop clicks. Never touch article/PDF
    // text layers here — capture-phase pointerup races the browser selection
    // and removeAllRanges() was cancelling new selects.
    const onUp = (e: Event) => {
      if (!armed) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (rootRef.current?.contains(target)) return;
      if (
        target.closest(
          ".personal-content, .prose-content, .pdf-text-layer, .textLayer, .pdf-page-wrap"
        )
      ) {
        return;
      }
      onCloseRef.current();
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerup", onUp, true);
    return () => {
      window.clearTimeout(armTimer);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerup", onUp, true);
    };
  }, []);

  const guard = (action: () => void, feature: string) => {
    if (locked) {
      onLockedClick?.(feature);
      return;
    }
    action();
  };

  const menu = (
    <div
      ref={rootRef}
      role="toolbar"
      aria-label="Highlight"
      className={`highlight-menu fixed z-[200] flex items-center gap-3 px-3.5 py-2.5 rounded-2xl shadow-2xl${
        locked ? " opacity-60 saturate-[0.85]" : ""
      }`}
      style={{
        top: Math.max(8, rect.top - 58),
        left: rect.left + rect.width / 2,
        transform: "translateX(-50%)",
        background: "#141416",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {showColors && (
        <div className="flex items-center gap-2.5">
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() =>
                guard(() => onHighlight(c.id), "Highlight and annotate")
              }
              className={`w-5 h-5 rounded-full shrink-0 transition-transform ${
                locked ? "cursor-not-allowed opacity-70" : "hover:scale-110"
              }`}
              style={{
                background: c.hex,
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
              }}
              title={
                locked
                  ? lockedFeatureLabel(lockedGate, `highlight (${c.id})`)
                  : `Highlight ${c.id}`
              }
              aria-label={`Highlight ${c.id}`}
              aria-disabled={locked}
            />
          ))}
        </div>
      )}

      {showColors && (onNote || onAsk || onRemove) && (
        <div
          className="w-px self-stretch min-h-[1.25rem]"
          style={{ background: "rgba(255,255,255,0.12)" }}
        />
      )}

      {onNote && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onNote && guard(onNote, "Highlight and annotate")}
          className={`flex items-center gap-1.5 text-[13px] font-medium leading-none ${
            locked ? "cursor-not-allowed opacity-70" : "hover:opacity-90"
          }`}
          style={{ color: "#e8c547" }}
          title={
            locked
              ? lockedFeatureLabel(lockedGate, "add a note")
              : "Add a note"
          }
          aria-disabled={locked}
        >
          <FileText className="w-3.5 h-3.5" strokeWidth={2} />
          Note
        </button>
      )}

      {onNote && onAsk && (
        <div
          className="w-px self-stretch min-h-[1.25rem]"
          style={{ background: "rgba(255,255,255,0.12)" }}
        />
      )}

      {onAsk && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onAsk && guard(onAsk, "Use Study AI")}
          className={`flex items-center gap-1.5 text-[13px] font-medium leading-none ${
            locked ? "cursor-not-allowed opacity-70" : "hover:opacity-90"
          }`}
          style={{ color: "#b8a4f8" }}
          title={
            locked
              ? lockedFeatureLabel(lockedGate, "ask Study AI")
              : withShortcut("Ask Study AI about this selection", "mod+l")
          }
          aria-disabled={locked}
        >
          <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
          Ask AI
        </button>
      )}

      {onRemove && (
        <>
          <div
            className="w-px self-stretch min-h-[1.25rem]"
            style={{ background: "rgba(255,255,255,0.12)" }}
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onRemove}
            className="flex items-center justify-center w-7 h-7 rounded-lg text-[#f87171] hover:bg-red-500/15"
            title="Remove highlight"
            aria-label="Remove highlight"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </>
      )}

      <div
        className="w-px self-stretch min-h-[1.25rem]"
        style={{ background: "rgba(255,255,255,0.12)" }}
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClose}
        className="flex items-center justify-center w-7 h-7 -mr-0.5 rounded-lg text-white/55 hover:text-white hover:bg-white/10"
        title="Close"
        aria-label="Close"
      >
        <X className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(menu, document.body);
}
