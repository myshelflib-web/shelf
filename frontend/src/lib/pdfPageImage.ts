/** Compress a rendered PDF canvas for Study AI vision (scanned pages). */
export function canvasToJpegDataUrl(
  canvas: HTMLCanvasElement,
  maxEdge = 1280,
  quality = 0.72
): string {
  const w = canvas.width;
  const h = canvas.height;
  if (w < 8 || h < 8) return "";
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  if (scale >= 0.99) {
    try {
      return canvas.toDataURL("image/jpeg", quality);
    } catch {
      return "";
    }
  }
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(w * scale));
  out.height = Math.max(1, Math.round(h * scale));
  const ctx = out.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  try {
    return out.toDataURL("image/jpeg", quality);
  } catch {
    return "";
  }
}
