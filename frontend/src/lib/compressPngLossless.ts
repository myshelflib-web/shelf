import { unzlibSync, zlibSync } from "fflate";
import { pngIdatPayload, rebuildPngWithIdat } from "./pngChunks";

/** Lossless PNG: recompress IDAT with zlib level 9. Pixels are unchanged. */
export function compressPngBytes(bytes: Uint8Array): Uint8Array | null {
  const parsed = pngIdatPayload(bytes);
  if (!parsed) return null;
  let raw: Uint8Array;
  try {
    raw = unzlibSync(parsed.idat);
  } catch {
    return null;
  }
  let packed: Uint8Array;
  try {
    packed = zlibSync(raw, { level: 9 });
  } catch {
    return null;
  }
  if (packed.byteLength >= parsed.idat.byteLength) return null;
  const out = rebuildPngWithIdat(parsed.chunks, packed);
  if (!out || out.byteLength >= bytes.byteLength) return null;
  return out;
}
