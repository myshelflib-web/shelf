export const COMPRESS_MIN_FILE_BYTES = 32 * 1024;
export const COMPRESS_MIN_IMAGE_BYTES = 24 * 1024;
export const COMPRESS_MAX_EDGE = 2000;
export const COMPRESS_JPEG_QUALITY = 0.8;
/** Keep the original unless the new file is at least this much smaller. */
export const COMPRESS_FILE_RATIO = 0.95;
export const COMPRESS_IMAGE_RATIO = 0.92;

export type CompressedRaster = {
  bytes: Uint8Array<ArrayBuffer>;
  width: number;
  height: number;
};

export type CompressRasterFn = (input: {
  bytes: Uint8Array;
  mime: string;
}) => Promise<CompressedRaster | null>;

export function copyBytes(src: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(src.byteLength);
  out.set(src);
  return out;
}

export function fileFromBytes(
  bytes: Uint8Array,
  file: File,
  type: string
): File {
  const copy = copyBytes(bytes);
  return new File([copy], file.name, {
    type,
    lastModified: file.lastModified,
  });
}

export function looksWorthKeeping(
  nextBytes: number,
  originalBytes: number,
  ratio = COMPRESS_FILE_RATIO
): boolean {
  return nextBytes > 0 && nextBytes < originalBytes * ratio;
}
