/** Shared image helpers for Doc + Sketch editors (paste / upload). */

export const EDITOR_IMAGE_MAX_EDGE = 1400;
export const EDITOR_IMAGE_JPEG_QUALITY = 0.82;
/** Soft cap so page HTML stays under the API body limit. */
export const EDITOR_IMAGE_MAX_DATA_URL_CHARS = 1_800_000;

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/bmp",
]);

export function isEditorImageFile(file: File | Blob): boolean {
  const type = (file.type || "").toLowerCase();
  if (ALLOWED_TYPES.has(type)) return true;
  if (file instanceof File) {
    return /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name);
  }
  return false;
}

export function imageFileFromClipboard(
  data: DataTransfer | null | undefined
): File | null {
  if (!data) return null;
  for (const item of [...data.items]) {
    if (item.kind !== "file" || !item.type.startsWith("image/")) continue;
    const file = item.getAsFile();
    if (file && isEditorImageFile(file)) return file;
  }
  for (const file of [...data.files]) {
    if (isEditorImageFile(file)) return file;
  }
  return null;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read image"));
    };
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

/**
 * Compress an image file to a JPEG/PNG data URL suitable for embedding in
 * page HTML. GIFs keep PNG encoding of the first frame (animation dropped).
 */
export async function fileToEditorDataUrl(
  file: Blob,
  opts?: { maxEdge?: number; quality?: number }
): Promise<{ dataUrl: string; width: number; height: number }> {
  if (!isEditorImageFile(file)) {
    throw new Error("Use a PNG, JPEG, WebP, GIF, or BMP image.");
  }
  const maxEdge = opts?.maxEdge ?? EDITOR_IMAGE_MAX_EDGE;
  const quality = opts?.quality ?? EDITOR_IMAGE_JPEG_QUALITY;
  const raw = await readFileAsDataUrl(file);
  const img = await loadImage(raw);
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height, 1));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image");
  ctx.drawImage(img, 0, 0, width, height);

  const preferPng =
    (file.type || "").includes("png") &&
    // Keep PNG for screenshots with transparency when small enough.
    width * height < 900_000;
  let dataUrl = preferPng
    ? canvas.toDataURL("image/png")
    : canvas.toDataURL("image/jpeg", quality);
  if (dataUrl.length > EDITOR_IMAGE_MAX_DATA_URL_CHARS) {
    dataUrl = canvas.toDataURL("image/jpeg", Math.min(quality, 0.7));
  }
  if (dataUrl.length > EDITOR_IMAGE_MAX_DATA_URL_CHARS) {
    throw new Error("Image is too large. Try a smaller photo or crop first.");
  }
  return { dataUrl, width, height };
}

export function buildDocImageHtml(dataUrl: string, alt = "Image"): string {
  const safeAlt = alt.replace(/"/g, "");
  return `<p><img class="shelf-doc-image" src="${dataUrl}" alt="${safeAlt}" /></p>`;
}

export function newSketchImageId(): string {
  return `img-${Math.random().toString(36).slice(2, 10)}`;
}
