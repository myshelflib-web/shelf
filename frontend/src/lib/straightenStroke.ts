const MIN_SPAN = 0.008;
const MIN_SPAN_PAD = 0.01;

/** Snap a freehand highlighter stroke to a clean horizontal or vertical line. */
export function straightenStroke(
  points: Array<{ x: number; y: number }>
): Array<{ x: number; y: number }> {
  if (points.length < 2) return points;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX;
  const spanY = maxY - minY;

  if (spanY > spanX) {
    const avgX = xs.reduce((a, b) => a + b, 0) / xs.length;
    const pad = spanY < MIN_SPAN ? MIN_SPAN_PAD : 0;
    return [
      { x: avgX, y: Math.max(0, minY - pad) },
      { x: avgX, y: Math.min(1, maxY + pad) },
    ];
  }

  const avgY = ys.reduce((a, b) => a + b, 0) / ys.length;
  const pad = spanX < MIN_SPAN ? MIN_SPAN_PAD : 0;
  return [
    { x: Math.max(0, minX - pad), y: avgY },
    { x: Math.min(1, maxX + pad), y: avgY },
  ];
}

/**
 * Normalized stroke width presets (fraction of page width).
 * L matches the previous XS (0.005); XS is a finer underline.
 */
export const PEN_WIDTHS = [
  { id: "xs", width: 0.0016, label: "XS", title: "Extra small", cursorPx: 7 },
  { id: "s", width: 0.0026, label: "S", title: "Small", cursorPx: 9 },
  { id: "m", width: 0.0036, label: "M", title: "Medium", cursorPx: 11 },
  { id: "l", width: 0.005, label: "L", title: "Large", cursorPx: 14 },
] as const;

export type PenWidthId = (typeof PEN_WIDTHS)[number]["id"];

export const DEFAULT_PEN_WIDTH: number =
  PEN_WIDTHS.find((s) => s.id === "m")?.width ?? PEN_WIDTHS[2].width;

/**
 * PDF ink pen — finer than the highlighter.
 * Medium matches highlighter XS (0.0016).
 */
export const INK_WIDTHS = [
  { id: "xs", width: 0.0007, label: "XS", title: "Extra small", cursorPx: 4 },
  { id: "s", width: 0.0011, label: "S", title: "Small", cursorPx: 5 },
  { id: "m", width: 0.0016, label: "M", title: "Medium", cursorPx: 6 },
  { id: "l", width: 0.0024, label: "L", title: "Large", cursorPx: 8 },
] as const;

export const DEFAULT_INK_WIDTH: number =
  INK_WIDTHS.find((s) => s.id === "m")?.width ?? 0.0016;

export const PEN_WIDTH_SLIDER = {
  min: 0.0012,
  max: 0.006,
  step: 0.0002,
} as const;

const WIDTH_MATCH = 0.00015;

function matchingPreset(width: number) {
  return (
    INK_WIDTHS.find((s) => Math.abs(s.width - width) < WIDTH_MATCH) ??
    PEN_WIDTHS.find((s) => Math.abs(s.width - width) < WIDTH_MATCH)
  );
}

/** Visible SVG stroke in CSS px (`vector-effect: non-scaling-stroke`). */
export function penStrokeWidthPx(width: number): number {
  return Math.min(14, Math.max(0.35, width * 550));
}

/** Invisible hit target so thin strokes stay easy to click. */
export function penHitWidthPx(width: number): number {
  return Math.max(14, width * 900);
}

export function penCursorPx(width: number): number {
  const match = matchingPreset(width);
  if (match) return match.cursorPx;
  return Math.round(Math.min(22, Math.max(6, width * 2200)));
}

export function penColorWithOpacity(
  rgb: string,
  opacity: number
): string {
  // rgb like "255, 220, 40"
  return `rgba(${rgb}, ${opacity})`;
}
