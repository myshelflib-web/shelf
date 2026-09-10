import prisma from "./prisma.js";
import { getObjectBuffer, uploadToS3 } from "../services/s3.js";
import { losslessCompressBuffer } from "./losslessCompress.js";
import { PDF_IMPORT_MAX_BYTES } from "./contentFiles.js";
import { logger, errorFields } from "./logger.js";

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

/**
 * Same as recompressS3ObjectIfSmaller, but no-ops when the client already
 * lossless-packed before PUT (avoids a full GetObject on complete).
 */
export async function recompressS3ObjectUnlessClientPacked(
  key: string,
  contentType: string,
  currentLength: number,
  clientPacked?: boolean
): Promise<number> {
  if (clientPacked) return currentLength;
  return recompressS3ObjectIfSmaller(key, contentType, currentLength);
}

/**
 * After a direct PUT lands in S3, pack in the background so complete/publish
 * stays snappy (including IndexedDB → S3 flush retries). Updates page size and
 * refunds storage delta when the object shrinks.
 */
export function scheduleBackgroundS3Recompress(input: {
  key: string;
  contentType: string;
  currentLength: number;
  pageId?: string;
  userId?: string;
  /** When true, client already packed — skip. */
  clientPacked?: boolean;
}): void {
  if (input.clientPacked) return;
  if (input.currentLength <= 0 || input.currentLength > SERVER_RECOMPRESS_MAX_BYTES) {
    return;
  }
  const { key, contentType, currentLength, pageId, userId } = input;
  void (async () => {
    const newLen = await recompressS3ObjectIfSmaller(
      key,
      contentType,
      currentLength
    );
    if (newLen >= currentLength) return;
    const saved = currentLength - newLen;
    if (pageId) {
      await prisma.userTopic.updateMany({
        where: { id: pageId, pdfKey: key },
        data: { fileSizeBytes: newLen },
      });
    }
    if (userId && saved > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { storageUsedBytes: { decrement: BigInt(saved) } },
      });
    }
    logger.info("s3.recompress.background", {
      key,
      pageId,
      fromBytes: currentLength,
      toBytes: newLen,
      savedBytes: saved,
    });
  })().catch((err) => {
    logger.warn("s3.recompress.background_failed", {
      key,
      pageId,
      ...errorFields(err),
    });
  });
}
