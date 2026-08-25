import { BLANK_TEXT_BOX_W, blankUid, type BlankPt, type BlankStroke, type BlankTextBox } from "@/lib/blankCanvas";
import { parseSvgPathPoints, polylineHitsPoint, rectHitsPoint } from "@/lib/eraseHit";

export function eraseBlankStrokesAt(
  paths: BlankStroke[],
  pt: BlankPt,
  penSize: number
): BlankStroke[] | null {
  const radius = Math.max(14, penSize * 2.4);
  const kept = paths.filter((stroke) => {
    const pts = parseSvgPathPoints(stroke.d);
    return !polylineHitsPoint(pts, pt, radius + stroke.width);
  });
  return kept.length === paths.length ? null : kept;
}

export function eraseBlankObjectAt(
  paths: BlankStroke[],
  boxes: BlankTextBox[],
  pt: BlankPt,
  boxHeight: (id: string) => number,
  canvasSize: { w: number; h: number }
): { paths?: BlankStroke[]; boxes?: BlankTextBox[]; activeId?: string | null } | null {
  const strokeHit = paths.findIndex((stroke) => {
    const pts = parseSvgPathPoints(stroke.d);
    return polylineHitsPoint(pts, pt, Math.max(16, stroke.width * 3));
  });
  if (strokeHit >= 0) {
    return { paths: paths.filter((_, i) => i !== strokeHit) };
  }
  const boxHit = boxes.find((b) => {
    const h = Math.max(36, boxHeight(b.id));
    return rectHitsPoint({ x: b.x, y: b.y, w: b.w, h }, pt, 6);
  });
  if (!boxHit) return null;
  const remaining = boxes.filter((b) => b.id !== boxHit.id);
  const next =
    remaining.length > 0
      ? remaining
      : [
          {
            id: blankUid(),
            x: Math.max(24, canvasSize.w / 2 - 140),
            y: Math.max(24, canvasSize.h / 2 - 40),
            w: BLANK_TEXT_BOX_W,
            html: "<p><br></p>",
          },
        ];
  return { boxes: next, activeId: next[0]?.id ?? null };
}
