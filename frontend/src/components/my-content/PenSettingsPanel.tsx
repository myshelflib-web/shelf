"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { HIGHLIGHT_COLORS } from "../HighlightToolbar";
import {
  PEN_WIDTHS,
  PEN_WIDTH_SLIDER,
  penStrokeWidthPx,
  type PenWidthId,
} from "@/lib/straightenStroke";

interface PenSettingsPanelProps {
  width: number;
  opacity: number;
  colorId: string;
  colorHex: string;
  anchorEl: HTMLElement | null;
  onWidthChange: (w: number) => void;
  onOpacityChange: (o: number) => void;
  onColorChange: (colorId: string) => void;
  onClose: () => void;
}

export function PenSettingsPanel({
  width,
  opacity,
  colorId,
  colorHex,
  anchorEl,
  onWidthChange,
  onOpacityChange,
  onColorChange,
  onClose,
}: PenSettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const activeId =
    PEN_WIDTHS.find((s) => Math.abs(s.width - width) < 0.00015)?.id ?? null;

  useLayoutEffect(() => {
    if (!anchorEl) return;
    const place = () => {
      const r = anchorEl.getBoundingClientRect();
      const panelW = 224;
      const left = Math.min(
        Math.max(8, r.right - panelW),
        window.innerWidth - panelW - 8
      );
      const top = Math.min(r.bottom + 8, window.innerHeight - 340);
      setPos({ top, left });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchorEl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    // No blocking backdrop: it swallowed the next click, so switching to the
    // eraser (or drawing) took two clicks. Close on any outside press instead.
    const onDown = (e: Event) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorEl?.contains(target)) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown, true);
    };
  }, [onClose, anchorEl]);

  if (!pos) return null;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Highlighter settings"
      className="fixed z-[91] w-56 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl p-3"
      style={{ top: pos.top, left: pos.left }}
    >
      <div
        className="h-10 rounded-lg mb-3 flex items-center justify-center overflow-hidden"
        style={{ background: "var(--bg-secondary)" }}
        aria-hidden
      >
        <svg width="140" height="28" viewBox="0 0 140 28">
          <path
            d="M8 18 C 30 6, 50 22, 70 12 S 110 20, 132 10"
            fill="none"
            stroke={colorHex}
            strokeOpacity={opacity}
            strokeWidth={Math.max(1.2, penStrokeWidthPx(width) * 1.6)}
            strokeLinecap="round"
          />
        </svg>
      </div>

      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1.5">
        Color
      </label>
      <div className="flex items-center justify-between gap-1.5 mb-3">
        {HIGHLIGHT_COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`w-6 h-6 rounded-full hover:scale-110 transition-transform ${
              colorId === c.id
                ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-elevated)]"
                : ""
            }`}
            style={{
              background: c.hex,
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)",
            }}
            title={c.id}
            aria-label={`Highlight color ${c.id}`}
            aria-pressed={colorId === c.id}
            onClick={() => onColorChange(c.id)}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-1 mb-3">
        {PEN_WIDTHS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`flex-1 h-7 rounded-md text-[10px] font-semibold ${
              activeId === s.id
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
            title={s.title}
            aria-label={s.title}
            aria-pressed={activeId === (s.id as PenWidthId)}
            onClick={() => onWidthChange(s.width)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1.5">
        Thickness
      </label>
      <input
        type="range"
        min={PEN_WIDTH_SLIDER.min}
        max={PEN_WIDTH_SLIDER.max}
        step={PEN_WIDTH_SLIDER.step}
        value={width}
        onChange={(e) => onWidthChange(Number(e.target.value))}
        className="w-full accent-[var(--accent)] h-1.5 mb-1"
        aria-label="Highlighter thickness"
      />
      <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-3">
        <span>Thin</span>
        <span>Thick</span>
      </div>

      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1.5">
        Opacity
      </label>
      <input
        type="range"
        min={0.2}
        max={0.95}
        step={0.05}
        value={opacity}
        onChange={(e) => onOpacityChange(Number(e.target.value))}
        className="w-full accent-[var(--accent)] h-1.5 mb-1"
        aria-label="Highlighter opacity"
      />
      <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
        <span>Faint</span>
        <span>Solid</span>
      </div>
    </div>
  );
}
