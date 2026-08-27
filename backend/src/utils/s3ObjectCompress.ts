import { getObjectBuffer, uploadToS3 } from "../services/s3.js";
import { losslessCompressBuffer } from "./losslessCompress.js";
import { PDF_IMPORT_MAX_BYTES } from "./contentFiles.js";

/** Don't pull huge S3 objects into memory just to re-pack them. */
export const SERVER_RECOMPRESS_MAX_BYTES = PDF_IMPORT_MAX_BYTES;

export async function compressAndUploadToS3(
  key: string,
  body: Buffer,
  contentType: string,
  filename = ""
): Promise<{ byteLength: number }> {
  const packed = await losslessCompressBuffer(body, contentType, filename);
  await uploadToS3(key, packed, contentType);
  return { byteLength: packed.length };
}

/** Re-pack an object already in S3 if it is small enough and shrinks. */
export async function recompressS3ObjectIfSmaller(
  key: string,
  contentType: string,
  currentLength: number
): Promise<number> {
  if (currentLength <= 0 || currentLength > SERVER_RECOMPRESS_MAX_BYTES) {
    return currentLength;
  }
  try {
    const { buffer } = await getObjectBuffer(key);
    const packed = await losslessCompressBuffer(buffer, contentType);
    if (packed.length >= buffer.length) return currentLength;
    await uploadToS3(key, packed, contentType);
    return packed.length;
  } catch {
    return currentLength;
  }
}
