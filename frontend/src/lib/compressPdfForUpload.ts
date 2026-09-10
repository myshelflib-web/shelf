import {
  PDFDocument,
  PDFName,
  PDFRawStream,
} from "pdf-lib";
import { COMPRESS_PDF_TIMEOUT_MS } from "./pdfCompressDecision";

/** Cap work so a pathological PDF cannot walk the tab into an OOM crash. */
const MAX_STREAMS_TO_FLATE = 250;

async function compressPdfBytesInner(
  source: ArrayBuffer | Uint8Array
): Promise<Uint8Array | null> {
  const bytes =
    source instanceof Uint8Array ? source : new Uint8Array(source);
  const doc = await PDFDocument.load(bytes, {
    ignoreEncryption: true,
    updateMetadata: false,
  });
  if (doc.isEncrypted) return null;

  let rewritten = 0;
  for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
    if (rewritten >= MAX_STREAMS_TO_FLATE) break;
    if (!(obj instanceof PDFRawStream)) continue;
    if (obj.dict.has(PDFName.of("Filter"))) continue;
    const contents = obj.getContents();
    if (contents.length < 64) continue;
    try {
      const flate = doc.context.flateStream(contents);
      if (flate.getContentsSize() >= contents.length) continue;
      for (const [key, value] of obj.dict.entries()) {
        const name = key.asString().replace(/^\//, "");
        if (name === "Length" || name === "Filter" || name === "DecodeParms") {
          continue;
        }
        flate.dict.set(key, value);
      }
      doc.context.assign(ref, flate);
      rewritten += 1;
    } catch {
      /* leave the original stream */
    }
  }

  // No streams rewritten — skip expensive object-stream save.
  if (rewritten === 0) return null;

  const saved = await doc.save({ useObjectStreams: true });
  if (saved.byteLength > 0 && saved.byteLength < bytes.byteLength) return saved;
  return null;
}

/**
 * Lossless PDF pack: Flate any uncompressed streams, then save with object
 * streams. Image pixels and page layout are not re-encoded.
 * Times out and returns null on hang / overload so upload can continue.
 */
export async function compressPdfBytes(
  source: ArrayBuffer | Uint8Array
): Promise<Uint8Array | null> {
  try {
    return await Promise.race([
      compressPdfBytesInner(source),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), COMPRESS_PDF_TIMEOUT_MS);
      }),
    ]);
  } catch {
    return null;
  }
}
