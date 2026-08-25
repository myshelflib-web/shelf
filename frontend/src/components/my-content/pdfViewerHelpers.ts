import { HIGHLIGHT_COLORS } from "../HighlightToolbar";
import type { UserContentHighlight } from "@/types";

export const PEN_RGB: Record<string, string> = {
  yellow: "255, 220, 40",
  green: "74, 222, 128",
  blue: "96, 165, 250",
  pink: "244, 114, 182",
  orange: "229, 152, 102",
};

export function penStroke(color: string, opacity = 0.72): string {
  return `rgba(${PEN_RGB[color] ?? PEN_RGB.yellow}, ${opacity})`;
}

export function highlightHex(colorId: string): string {
  return HIGHLIGHT_COLORS.find((c) => c.id === colorId)?.hex ?? "#f0d66e";
}

export function isInkHighlight(h: UserContentHighlight): boolean {
  return h.position?.type === "pen" && h.position.tool === "ink";
}

export function mergeLineRects(
  rects: Array<{ x: number; y: number; w: number; h: number }>
) {
  const sorted = [...rects].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines: typeof rects = [];
  for (const r of sorted) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(r.y - last.y) < Math.max(last.h, r.h) * 0.45) {
      const right = Math.max(last.x + last.w, r.x + r.w);
      last.x = Math.min(last.x, r.x);
      last.w = right - last.x;
      last.h = Math.max(last.h, r.h);
      last.y = Math.min(last.y, r.y);
    } else {
      lines.push({ ...r });
    }
  }
  return lines;
}

/** Marker covers most of the glyph box — tall enough to read through. */
export function markerRect(r: {
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  if (r.h > 0 && r.h <= 0.012) {
    const h = Math.max(r.h, 0.016);
    return { x: r.x, y: Math.max(0, r.y - (h - r.h) * 0.35), w: r.w, h };
  }
  const h = Math.max(0.016, Math.min(r.h * 0.78, 0.042));
  const y = r.y + (r.h - h) * 0.42;
  return { x: r.x, y, w: r.w, h };
}

export function pointsToPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x * 100} ${p.y * 100}`)
    .join(" ");
}
