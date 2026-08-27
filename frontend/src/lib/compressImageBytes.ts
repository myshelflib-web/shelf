import {
  COMPRESS_JPEG_QUALITY,
  COMPRESS_MAX_EDGE,
  COMPRESS_MIN_IMAGE_BYTES,
  copyBytes,
  type CompressedRaster,
} from "./compressUploadShared";

function blobFromBytes(bytes: Uint8Array, type: string): Blob {
  return new Blob([copyBytes(bytes)], { type });
}

function canvasToJpeg(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  quality: number
): Promise<Uint8Array<ArrayBuffer> | null> {
  if ("convertToBlob" in canvas && typeof canvas.convertToBlob === "function") {
    return canvas
      .convertToBlob({ type: "image/jpeg", quality })
      .then(async (blob) => new Uint8Array(await blob.arrayBuffer()))
      .catch(() => null);
  }
  if (!("toBlob" in canvas) || typeof canvas.toBlob !== "function") {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        void blob.arrayBuffer().then(
          (buf) => resolve(new Uint8Array(buf)),
          () => resolve(null)
        );
      },
      "image/jpeg",
      quality
    );
  });
}

function makeCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas | null {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

async function rasterToJpeg(
  source: CanvasImageSource | ImageBitmap,
  srcW: number,
  srcH: number,
  maxEdge: number,
  quality: number
): Promise<CompressedRaster | null> {
  if (srcW < 8 || srcH < 8) return null;
  const scale = Math.min(1, maxEdge / Math.max(srcW, srcH));
  const width = Math.max(1, Math.round(srcW * scale));
  const height = Math.max(1, Math.round(srcH * scale));
  const canvas = makeCanvas(width, height);
  if (!canvas) return null;
  const ctx = canvas.getContext("2d") as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, width, height);
  const bytes = await canvasToJpeg(canvas, quality);
  if (!bytes || bytes.byteLength < 32) return null;
  return { bytes, width, height };
}

export async function compressImageBytes(input: {
  bytes: Uint8Array;
  mime: string;
  maxEdge?: number;
  quality?: number;
}): Promise<CompressedRaster | null> {
  if (input.bytes.byteLength < COMPRESS_MIN_IMAGE_BYTES) return null;
  const mime = input.mime.toLowerCase();
  if (!/^image\/(jpeg|jpg|png|webp|gif|bmp)$/.test(mime)) return null;
  const maxEdge = input.maxEdge ?? COMPRESS_MAX_EDGE;
  const quality = input.quality ?? COMPRESS_JPEG_QUALITY;

  if (typeof createImageBitmap === "function") {
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await createImageBitmap(blobFromBytes(input.bytes, mime));
      return rasterToJpeg(bitmap, bitmap.width, bitmap.height, maxEdge, quality);
    } catch {
      return null;
    } finally {
      bitmap?.close();
    }
  }

  if (typeof Image === "undefined" || typeof URL === "undefined") return null;

  return new Promise((resolve) => {
    const url = URL.createObjectURL(blobFromBytes(input.bytes, mime));
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      void rasterToJpeg(img, img.naturalWidth, img.naturalHeight, maxEdge, quality).then(
        resolve,
        () => resolve(null)
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export async function compressRawRaster(input: {
  pixels: Uint8Array;
  width: number;
  height: number;
  channels: 1 | 3;
  maxEdge?: number;
  quality?: number;
}): Promise<CompressedRaster | null> {
  const { width: srcW, height: srcH, channels } = input;
  if (srcW < 8 || srcH < 8) return null;
  if (typeof document === "undefined" && typeof OffscreenCanvas === "undefined") {
    return null;
  }
  const expected = srcW * srcH * channels;
  if (input.pixels.byteLength < expected) return null;

  const scale = Math.min(1, (input.maxEdge ?? COMPRESS_MAX_EDGE) / Math.max(srcW, srcH));
  const width = Math.max(1, Math.round(srcW * scale));
  const height = Math.max(1, Math.round(srcH * scale));
  const canvas = makeCanvas(srcW, srcH);
  if (!canvas) return null;
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | null;
  if (!ctx || !("createImageData" in ctx)) return null;

  const imageData = ctx.createImageData(srcW, srcH);
  const src = input.pixels;
  const dst = imageData.data;
  for (let i = 0, p = 0; i < srcW * srcH; i += 1, p += 4) {
    if (channels === 1) {
      const g = src[i] ?? 0;
      dst[p] = g;
      dst[p + 1] = g;
      dst[p + 2] = g;
    } else {
      const o = i * 3;
      dst[p] = src[o] ?? 0;
      dst[p + 1] = src[o + 1] ?? 0;
      dst[p + 2] = src[o + 2] ?? 0;
    }
    dst[p + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);

  let source: HTMLCanvasElement | OffscreenCanvas = canvas;
  if (width !== srcW || height !== srcH) {
    const scaled = makeCanvas(width, height);
    if (!scaled) return null;
    const sctx = scaled.getContext("2d");
    if (!sctx) return null;
    sctx.drawImage(canvas as CanvasImageSource, 0, 0, width, height);
    source = scaled;
  }

  const bytes = await canvasToJpeg(
    source,
    input.quality ?? COMPRESS_JPEG_QUALITY
  );
  if (!bytes || bytes.byteLength < 32) return null;
  return { bytes, width, height };
}
