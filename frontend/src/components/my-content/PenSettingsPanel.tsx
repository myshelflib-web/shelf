"use client";

import { HIGHLIGHT_COLORS } from "../HighlightToolbar";
import {
  PEN_WIDTHS,
  PEN_WIDTH_SLIDER,
  penStrokeWidthPx,
  type PenWidthId,
} from "@/lib/straightenStroke";
import { ColorSwatch, ToolPopover } from "./ToolPopover";

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
  const activeId =
    PEN_WIDTHS.find((s) => Math.abs(s.width - width) < 0.00015)?.id ?? null;

  return (
    <ToolPopover
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorEl={anchorEl}
      title="Pen / highlighter"
      widthClass="w-56"
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

      <p className="text-[11px] font-medium text-[var(--text-secondary)] mb-2">
        Color
      </p>
      <div className="grid grid-cols-6 gap-2 mb-3">
        {HIGHLIGHT_COLORS.map((c) => (
          <ColorSwatch
            key={c.id}
            color={c.hex}
            label={`Highlight ${c.id}`}
            selected={colorId === c.id}
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
    </ToolPopover>
  );
}
