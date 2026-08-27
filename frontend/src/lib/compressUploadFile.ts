import { compressDocxBytes } from "./compressDocxForUpload";
import { compressPdfBytes } from "./compressPdfForUpload";
import {
  COMPRESS_MIN_FILE_BYTES,
  fileFromBytes,
  looksWorthKeeping,
} from "./compressUploadShared";

export function shouldCompressUpload(file: File): boolean {
  if (file.size < COMPRESS_MIN_FILE_BYTES) return false;
  const name = file.name.toLowerCase();
  return name.endsWith(".pdf") || name.endsWith(".docx");
}

/**
 * Shrink PDF / DOCX images in the browser before the S3 PUT.
 * TXT/MD are left alone. Falls back to the original file on any failure
 * or when the result is not meaningfully smaller.
 */
export async function compressUploadFile(file: File): Promise<File> {
  if (!shouldCompressUpload(file)) return file;
  const name = file.name.toLowerCase();

  try {
    if (name.endsWith(".pdf")) {
      const next = await compressPdfBytes(await file.arrayBuffer());
      if (!next || !looksWorthKeeping(next.byteLength, file.size)) return file;
      return fileFromBytes(next, file, "application/pdf");
    }
    if (name.endsWith(".docx")) {
      const next = await compressDocxBytes(await file.arrayBuffer());
      if (!next || !looksWorthKeeping(next.byteLength, file.size)) return file;
      return fileFromBytes(
        next,
        file,
        file.type ||
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
    }
  } catch {
    return file;
  }

  return file;
}
