import { compressDocxBytes } from "./compressDocxForUpload";
import { compressPdfBytes } from "./compressPdfForUpload";
import { compressPngBytes } from "./compressPngLossless";
import {
  COMPRESS_MIN_FILE_BYTES,
  fileFromBytes,
  looksWorthKeeping,
} from "./compressUploadShared";

function extOf(file: File): string {
  const name = file.name.toLowerCase();
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot) : "";
}

function mimeOf(file: File): string {
  return (file.type || "").toLowerCase();
}

export function shouldCompressUpload(file: File): boolean {
  if (file.size < COMPRESS_MIN_FILE_BYTES) return false;
  const ext = extOf(file);
  const mime = mimeOf(file);
  return (
    ext === ".pdf" ||
    mime === "application/pdf" ||
    ext === ".docx" ||
    mime.includes("wordprocessingml") ||
    ext === ".png" ||
    mime === "image/png"
  );
}

/**
 * Lossless pack before upload. JPEG/TXT/MD are left as-is (already compact,
 * and re-encoding JPEG would be lossy). Falls back to the original file
 * when packing fails or does not shrink.
 */
export async function compressUploadFile(file: File): Promise<File> {
  const ext = extOf(file);
  const mime = mimeOf(file);

  try {
    if (ext === ".pdf" || mime === "application/pdf") {
      if (file.size < COMPRESS_MIN_FILE_BYTES) return file;
      const next = await compressPdfBytes(await file.arrayBuffer());
      if (!next || !looksWorthKeeping(next.byteLength, file.size)) return file;
      return fileFromBytes(next, file, "application/pdf");
    }
    if (ext === ".docx" || mime.includes("wordprocessingml")) {
      if (file.size < COMPRESS_MIN_FILE_BYTES) return file;
      const next = compressDocxBytes(await file.arrayBuffer());
      if (!next || !looksWorthKeeping(next.byteLength, file.size)) return file;
      return fileFromBytes(
        next,
        file,
        file.type ||
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
    }
    if (ext === ".png" || mime === "image/png") {
      const next = compressPngBytes(new Uint8Array(await file.arrayBuffer()));
      if (!next || !looksWorthKeeping(next.byteLength, file.size)) return file;
      return fileFromBytes(next, file, "image/png");
    }
  } catch {
    return file;
  }

  return file;
}

export async function compressFormDataFiles(
  formData: FormData,
  keys: string[]
): Promise<FormData> {
  for (const key of keys) {
    const value = formData.get(key);
    if (value instanceof File) {
      formData.set(key, await compressUploadFile(value));
    }
  }
  return formData;
}
