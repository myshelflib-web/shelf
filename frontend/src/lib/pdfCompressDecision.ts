/**
 * Skip client pdf-lib below this. Small PDFs (resumes, one-pagers) gain almost
 * nothing, and pdf-lib rewrite can hang / OOM-crash the tab on some files.
 */
export const COMPRESS_PDF_MIN_ATTEMPT_BYTES = 1024 * 1024;

/** Skip client pdf-lib pack above this — too slow for little gain on large files. */
export const COMPRESS_PDF_MAX_ATTEMPT_BYTES = 12 * 1024 * 1024;

/** Abort packing if pdf-lib has not finished within this window. */
export const COMPRESS_PDF_TIMEOUT_MS = 5_000;

const ALREADY_PACKED_PROBE = 64 * 1024;

/**
 * Heuristic: PDFs that already use object streams are usually compact enough
 * that a client lossless pass won't shrink them enough to justify the CPU.
 */
export function pdfLooksAlreadyPacked(bytes: ArrayBuffer | Uint8Array): boolean {
  const view =
    bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const n = Math.min(view.byteLength, ALREADY_PACKED_PROBE);
  if (n < 8) return false;
  // Avoid TextDecoder on huge buffers — scan ASCII for /ObjStm.
  let matched = 0;
  const needle = "/ObjStm";
  for (let i = 0; i < n; i += 1) {
    const c = view[i];
    if (c === needle.charCodeAt(matched)) {
      matched += 1;
      if (matched === needle.length) return true;
    } else {
      matched = c === needle.charCodeAt(0) ? 1 : 0;
    }
  }
  return false;
}

export type PdfCompressDecision = {
  /** Run pdf-lib before PUT (shows "compressing" in the UI). */
  attempt: boolean;
  /**
   * Tell the server to skip GetObject recompress. True when we packed, or when
   * we intentionally skip because the file is already compact / too large.
   */
  clientPacked: boolean;
};

export function decidePdfCompress(file: File): PdfCompressDecision {
  if (file.size < COMPRESS_PDF_MIN_ATTEMPT_BYTES) {
    return { attempt: false, clientPacked: true };
  }
  if (file.size > COMPRESS_PDF_MAX_ATTEMPT_BYTES) {
    return { attempt: false, clientPacked: true };
  }
  return { attempt: true, clientPacked: true };
}

export async function shouldAttemptPdfCompress(file: File): Promise<boolean> {
  const base = decidePdfCompress(file);
  if (!base.attempt) return false;
  try {
    const slice = file.slice(0, ALREADY_PACKED_PROBE);
    const buf = await slice.arrayBuffer();
    if (pdfLooksAlreadyPacked(buf)) return false;
  } catch {
    /* attempt anyway */
  }
  return true;
}
