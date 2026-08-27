import { unzipSync, zipSync } from "fflate";
import { compressPngBytes } from "./losslessPng.js";

/** Lossless ZIP/DOCX: recompress PNG parts, re-deflate archive at level 9. */
export function compressZipBytes(source: Uint8Array): Uint8Array | null {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(source);
  } catch {
    return null;
  }

  for (const [path, data] of Object.entries(entries)) {
    if (!data || !/\.png$/i.test(path)) continue;
    const next = compressPngBytes(data);
    if (next) entries[path] = next;
  }

  try {
    const out = zipSync(entries, { level: 9 });
    if (out.byteLength > 0 && out.byteLength < source.byteLength) return out;
    return null;
  } catch {
    return null;
  }
}
