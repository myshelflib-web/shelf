import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { compressImageBytes } from "./compressImageBytes";
import {
  COMPRESS_IMAGE_RATIO,
  COMPRESS_MIN_IMAGE_BYTES,
  looksWorthKeeping,
  type CompressRasterFn,
} from "./compressUploadShared";

const MEDIA_RE = /^word\/media\/.+\.(jpe?g|png|gif|webp|bmp)$/i;
const CONTENT_TYPES_KEY = "[Content_Types].xml";

function mimeForName(name: string): string | null {
  const ext = name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "bmp":
      return "image/bmp";
    default:
      return null;
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function partNameFor(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function setPartContentType(
  xml: string,
  path: string,
  contentType: string
): string {
  const part = partNameFor(path);
  const re = new RegExp(
    `<Override\\b[^>]*PartName="${escapeRegExp(part)}"[^>]*/>`,
    "i"
  );
  const tag = `<Override PartName="${part}" ContentType="${contentType}"/>`;
  if (re.test(xml)) return xml.replace(re, tag);
  if (/<\/Types>/i.test(xml)) {
    return xml.replace(/<\/Types>/i, `  ${tag}\n</Types>`);
  }
  return xml;
}

export async function compressDocxBytes(
  source: ArrayBuffer | Uint8Array,
  compressImage: CompressRasterFn = compressImageBytes
): Promise<Uint8Array | null> {
  const bytes =
    source instanceof Uint8Array ? source : new Uint8Array(source);
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(bytes);
  } catch {
    return null;
  }

  const paths = Object.keys(entries).filter((p) => MEDIA_RE.test(p));
  if (paths.length === 0) return null;

  let changed = 0;
  const typeUpdates: { path: string; mime: string }[] = [];

  for (const path of paths) {
    const original = entries[path];
    if (!original || original.byteLength < COMPRESS_MIN_IMAGE_BYTES) continue;
    const mime = mimeForName(path);
    if (!mime) continue;

    const next = await compressImage({ bytes: original, mime });
    if (
      !next ||
      !looksWorthKeeping(
        next.bytes.byteLength,
        original.byteLength,
        COMPRESS_IMAGE_RATIO
      )
    ) {
      continue;
    }
    entries[path] = next.bytes;
    typeUpdates.push({ path, mime: "image/jpeg" });
    changed += 1;
  }

  if (changed === 0) return null;

  const typesXml = entries[CONTENT_TYPES_KEY];
  if (typesXml) {
    let xml = strFromU8(typesXml);
    for (const update of typeUpdates) {
      xml = setPartContentType(xml, update.path, update.mime);
    }
    entries[CONTENT_TYPES_KEY] = strToU8(xml);
  }

  try {
    return zipSync(entries, { level: 8 });
  } catch {
    return null;
  }
}
