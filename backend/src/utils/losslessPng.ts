import { unzlibSync, zlibSync } from "fflate";

const PNG_SIG = [137, 80, 78, 71, 13, 10, 26, 10];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    c = CRC_TABLE[(c ^ bytes[i]!) & 255]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function readU32(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset]! << 24) |
      (bytes[offset + 1]! << 16) |
      (bytes[offset + 2]! << 8) |
      bytes[offset + 3]!) >>>
    0
  );
}

function writeU32(n: number, into: Uint8Array, offset: number) {
  into[offset] = (n >>> 24) & 255;
  into[offset + 1] = (n >>> 16) & 255;
  into[offset + 2] = (n >>> 8) & 255;
  into[offset + 3] = n & 255;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const p of parts) total += p.byteLength;
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.byteLength;
  }
  return out;
}

type PngChunk = { type: string; data: Uint8Array };

function parsePng(bytes: Uint8Array): PngChunk[] | null {
  if (bytes.length < 24) return null;
  for (let i = 0; i < 8; i += 1) {
    if (bytes[i] !== PNG_SIG[i]) return null;
  }
  const chunks: PngChunk[] = [];
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const len = readU32(bytes, offset);
    if (offset + 12 + len > bytes.length) return null;
    const type = String.fromCharCode(
      bytes[offset + 4]!,
      bytes[offset + 5]!,
      bytes[offset + 6]!,
      bytes[offset + 7]!
    );
    chunks.push({
      type,
      data: bytes.slice(offset + 8, offset + 8 + len),
    });
    offset += 12 + len;
    if (type === "IEND") break;
  }
  return chunks.length ? chunks : null;
}

function encodePng(chunks: PngChunk[]): Uint8Array {
  let total = 8;
  for (const c of chunks) total += 12 + c.data.byteLength;
  const out = new Uint8Array(total);
  out.set(PNG_SIG);
  let o = 8;
  for (const c of chunks) {
    writeU32(c.data.byteLength, out, o);
    out[o + 4] = c.type.charCodeAt(0);
    out[o + 5] = c.type.charCodeAt(1);
    out[o + 6] = c.type.charCodeAt(2);
    out[o + 7] = c.type.charCodeAt(3);
    out.set(c.data, o + 8);
    writeU32(
      crc32(out.subarray(o + 4, o + 8 + c.data.byteLength)),
      out,
      o + 8 + c.data.byteLength
    );
    o += 12 + c.data.byteLength;
  }
  return out;
}

/** Lossless PNG: recompress IDAT with zlib level 9. */
export function compressPngBytes(bytes: Uint8Array): Uint8Array | null {
  const chunks = parsePng(bytes);
  if (!chunks) return null;
  const parts = chunks.filter((c) => c.type === "IDAT").map((c) => c.data);
  if (parts.length === 0) return null;
  const idat = concatBytes(parts);
  let raw: Uint8Array;
  try {
    raw = unzlibSync(idat);
  } catch {
    return null;
  }
  let packed: Uint8Array;
  try {
    packed = zlibSync(raw, { level: 9 });
  } catch {
    return null;
  }
  if (packed.byteLength >= idat.byteLength) return null;
  const kept = chunks.filter((c) => c.type !== "IDAT");
  const iend = kept.findIndex((c) => c.type === "IEND");
  if (iend < 0) return null;
  kept.splice(iend, 0, { type: "IDAT", data: packed });
  const out = encodePng(kept);
  if (out.byteLength >= bytes.byteLength) return null;
  return out;
}
