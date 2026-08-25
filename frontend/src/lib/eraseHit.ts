export type ErasePt = { x: number; y: number };
export type EraseRect = { x: number; y: number; w: number; h: number };

export function distToSegment2(
  p: ErasePt,
  a: ErasePt,
  b: ErasePt
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-12) {
    const ex = p.x - a.x;
    const ey = p.y - a.y;
    return ex * ex + ey * ey;
  }
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const qx = a.x + t * dx;
  const qy = a.y + t * dy;
  const ex = p.x - qx;
  const ey = p.y - qy;
  return ex * ex + ey * ey;
}

export function polylineHitsPoint(
  points: ErasePt[],
  p: ErasePt,
  radius: number
): boolean {
  if (!points.length) return false;
  const r2 = radius * radius;
  if (points.length === 1) {
    const ex = p.x - points[0].x;
    const ey = p.y - points[0].y;
    return ex * ex + ey * ey <= r2;
  }
  for (let i = 1; i < points.length; i++) {
    if (distToSegment2(p, points[i - 1], points[i]) <= r2) return true;
  }
  return false;
}

export function rectHitsPoint(r: EraseRect, p: ErasePt, pad = 0): boolean {
  return (
    p.x >= r.x - pad &&
    p.x <= r.x + r.w + pad &&
    p.y >= r.y - pad &&
    p.y <= r.y + r.h + pad
  );
}

export function parseSvgPathPoints(d: string): ErasePt[] {
  const pts: ErasePt[] = [];
  const re = /[ML]\s*([-\d.]+)\s+([-\d.]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) {
    pts.push({ x: Number(m[1]), y: Number(m[2]) });
  }
  return pts;
}
