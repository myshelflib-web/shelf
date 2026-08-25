"use client";

import { useEffect, useRef } from "react";
import { FileText, Sparkles, X } from "lucide-react";
import { withShortcut } from "@/lib/hotkeys";

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
  /** When set, shows X to delete the highlight */
  onRemove?: () => void;
  onClose: () => void;
  showColors?: boolean;
  /** Account-only — controls stay visible but muted; clicks call onLockedClick. */
  locked?: boolean;
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
  onLockedClick,
}: HighlightToolbarProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // pointerdown, not mousedown: drawing modes call preventDefault() on
    // pointerdown, which suppresses the compatibility mouse events.
    const onDown = (e: Event) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const guard = (action: () => void, feature: string) => {
    if (locked) {
      onLockedClick?.(feature);
      return;
    }
    action();
  };

  return (
    <div
      ref={rootRef}
      role="toolbar"
      aria-label="Highlight"
      className={`highlight-menu fixed z-[100] flex items-center gap-3 px-3.5 py-2.5 rounded-2xl shadow-2xl${
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
              onClick={() => guard(() => onHighlight(c.id), "Highlight and annotate")}
              className={`w-5 h-5 rounded-full shrink-0 transition-transform ${
                locked ? "cursor-not-allowed opacity-70" : "hover:scale-110"
              }`}
              style={{
                background: c.hex,
                boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
              }}
              title={locked ? `Sign in to highlight (${c.id})` : `Highlight ${c.id}`}
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
          onClick={() => onNote && guard(onNote, "Highlight and annotate")}
          className={`flex items-center gap-1.5 text-[13px] font-medium leading-none ${
            locked ? "cursor-not-allowed opacity-70" : "hover:opacity-90"
          }`}
          style={{ color: "#e8c547" }}
          title={locked ? "Sign in to add a note" : "Add a note"}
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
          onClick={() => onAsk && guard(onAsk, "Use Study AI")}
          className={`flex items-center gap-1.5 text-[13px] font-medium leading-none ${
            locked ? "cursor-not-allowed opacity-70" : "hover:opacity-90"
          }`}
          style={{ color: "#b8a4f8" }}
          title={
            locked
              ? "Sign in to ask Study AI"
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
            onClick={onRemove}
            className="flex items-center justify-center w-7 h-7 -mr-0.5 rounded-lg text-[#f87171] hover:bg-red-500/15"
            title="Remove highlight"
            aria-label="Remove highlight"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </>
      )}
    </div>
  );
}
