import type { BlankPt, BlankStroke, BlankTextBox } from "@/lib/blankCanvas";

const EDGE = 200;
const GROW = 1000;

/** Grow the blank canvas when drawing near an edge; shift content if growing left/top. */
export function expandBlankCanvasAround(
  x: number,
  y: number,
  size: { w: number; h: number },
  paths: BlankStroke[],
  boxes: BlankTextBox[],
  strokePts: BlankPt[]
): {
  ox: number;
  oy: number;
  size: { w: number; h: number };
  paths: BlankStroke[];
  boxes: BlankTextBox[];
  strokePts: BlankPt[];
} | null {
  let { w, h } = size;
  let ox = 0;
  let oy = 0;
  if (x > w - EDGE) w += GROW;
  if (y > h - EDGE) h += GROW;
  if (x < EDGE) {
    ox = GROW;
    w += GROW;
  }
  if (y < EDGE) {
    oy = GROW;
    h += GROW;
  }
  if (!ox && !oy && w === size.w && h === size.h) return null;

  return {
    ox,
    oy,
    size: { w, h },
    paths: paths.map((p) => ({
      ...p,
      d: p.d.replace(/([ML])\s*([\d.-]+)\s+([\d.-]+)/g, (_, cmd, px, py) => {
        return `${cmd} ${(Number(px) + ox).toFixed(1)} ${(Number(py) + oy).toFixed(1)}`;
      }),
    })),
    boxes: boxes.map((b) => ({
      ...b,
      x: b.x + ox,
      y: b.y + oy,
    })),
    strokePts: strokePts.map((p) => ({
      x: p.x + ox,
      y: p.y + oy,
    })),
  };
}
