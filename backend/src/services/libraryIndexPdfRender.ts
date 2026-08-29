import { createCanvas } from "@napi-rs/canvas";

const MAX_EDGE = 640;
const JPEG_QUALITY = 50;
const MAX_PIXELS = MAX_EDGE * 900;

/** Rasterize one pdf.js page to a small JPEG for scanned-page OCR. */
export async function renderPdfPageToJpeg(page: {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  render: (opts: Record<string, unknown>) => { promise: Promise<void> };
}): Promise<Buffer | null> {
  const base = page.getViewport({ scale: 1 });
  const scale = Math.min(1, MAX_EDGE / Math.max(base.width, base.height, 1));
  const viewport = page.getViewport({ scale: Math.max(0.35, scale) });
  const width = Math.max(1, Math.ceil(viewport.width));
  const height = Math.max(1, Math.ceil(viewport.height));
  if (width * height > MAX_PIXELS) return null;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  try {
    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    }).promise;
    return Buffer.from(await canvas.encode("jpeg", JPEG_QUALITY));
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}
