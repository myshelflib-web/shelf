import { compressPdfBytes } from "./losslessPdf.js";
import { compressPngBytes } from "./losslessPng.js";
import { compressZipBytes } from "./losslessZip.js";

export type CompressKind = "pdf" | "png" | "zip" | "skip";

export function detectCompressKind(
  contentType: string,
  filename = ""
): CompressKind {
  const mime = (contentType || "").split(";")[0].trim().toLowerCase();
  const name = filename.toLowerCase();
  if (mime === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (mime === "image/png" || name.endsWith(".png")) return "png";
  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/zip" ||
    name.endsWith(".docx")
  ) {
    return "zip";
  }
  return "skip";
}

/**
 * Lossless pack for stored bytes. Returns the original buffer when packing
 * fails or would not shrink. JPEG is left as-is (re-encoding is lossy).
 */
export async function losslessCompressBuffer(
  input: Buffer,
  contentType: string,
  filename = ""
): Promise<Buffer> {
  if (!input.length) return input;
  const kind = detectCompressKind(contentType, filename);
  if (kind === "skip") return input;

  try {
    const src = new Uint8Array(input);
    let next: Uint8Array | null = null;
    if (kind === "pdf") next = await compressPdfBytes(src);
    else if (kind === "png") next = compressPngBytes(src);
    else next = compressZipBytes(src);
    if (next && next.byteLength > 0 && next.byteLength < input.length) {
      return Buffer.from(next);
    }
  } catch {
    return input;
  }
  return input;
}
