import type { PDFDocumentProxy } from "pdfjs-dist";
import type { UserContentHighlight } from "@/types";

export const GENERIC_HIGHLIGHT_TEXT = new Set([
  "Highlighted region",
  "Ink stroke",
  "Highlight",
]);

export function isGenericHighlightText(
  text: string | null | undefined
): boolean {
  const t = text?.trim();
  return !t || GENERIC_HIGHLIGHT_TEXT.has(t);
}

type NormRect = { x: number; y: number; w: number; h: number };

function intersects(a: NormRect, b: NormRect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function highlightRegionRects(
  h: UserContentHighlight
): NormRect[] {
  if (h.position?.rects?.length) return h.position.rects;
  const pts = h.position?.points;
  if (!pts?.length) return [];
  const pad = 0.012;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const x0 = Math.max(0, Math.min(...xs) - pad);
  const y0 = Math.max(0, Math.min(...ys) - pad);
  const x1 = Math.min(1, Math.max(...xs) + pad);
  const y1 = Math.min(1, Math.max(...ys) + pad);
  return [{ x: x0, y: y0, w: Math.max(0.01, x1 - x0), h: Math.max(0.01, y1 - y0) }];
}

export function mergeNormRects(rects: NormRect[]): NormRect {
  if (!rects.length) return { x: 0, y: 0, w: 1, h: 0.08 };
  const x0 = Math.min(...rects.map((r) => r.x));
  const y0 = Math.min(...rects.map((r) => r.y));
  const x1 = Math.max(...rects.map((r) => r.x + r.w));
  const y1 = Math.max(...rects.map((r) => r.y + r.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function collapseSpaces(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

export async function extractPdfTextInRegion(
  pdfDoc: PDFDocumentProxy,
  pageNum: number,
  region: NormRect
): Promise<string> {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1 });
  const pw = viewport.width;
  const ph = viewport.height;
  const textContent = await page.getTextContent();
  const parts: string[] = [];

  for (const item of textContent.items) {
    if (!("str" in item) || !item.str.trim()) continue;
    const tm = item.transform;
    const fontSize = Math.hypot(tm[0], tm[1]) || 10;
    const x = tm[4];
    const y = tm[5];
    const w = item.width || fontSize * item.str.length * 0.55;
    const h = fontSize;

    const nx = x / pw;
    const nw = w / pw;
    const ny = 1 - y / ph;
    const nh = h / ph;
    const itemBox: NormRect = {
      x: nx,
      y: Math.max(0, ny - nh),
      w: Math.max(0.002, nw),
      h: Math.max(0.002, nh),
    };

    if (intersects(itemBox, region)) parts.push(item.str);
  }

  return collapseSpaces(parts.join(" "));
}

export async function extractHighlightPdfText(
  pdfDoc: PDFDocumentProxy,
  h: UserContentHighlight
): Promise<string> {
  const pageNum = h.pageNumber ?? 1;
  const region = mergeNormRects(highlightRegionRects(h));
  return extractPdfTextInRegion(pdfDoc, pageNum, region);
}
