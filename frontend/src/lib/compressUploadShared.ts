export const COMPRESS_MIN_FILE_BYTES = 8 * 1024;
/** Keep the original unless the new file is at least this much smaller. */
export const COMPRESS_FILE_RATIO = 0.99;

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
