import { PDFDocument, PDFName, PDFRawStream } from "pdf-lib";

/** Lossless PDF pack: Flate uncompressed streams + object streams. */
export async function compressPdfBytes(
  source: Uint8Array
): Promise<Uint8Array | null> {
  const doc = await PDFDocument.load(source, {
    ignoreEncryption: true,
    updateMetadata: false,
  });
  if (doc.isEncrypted) return null;

  for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
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
    } catch {
      /* leave original stream */
    }
  }

  const saved = await doc.save({ useObjectStreams: true });
  if (saved.byteLength > 0 && saved.byteLength < source.byteLength) return saved;
  return null;
}
