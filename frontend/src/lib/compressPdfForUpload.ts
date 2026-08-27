import {
  PDFArray,
  PDFBool,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFRawStream,
  decodePDFRawStream,
  type PDFRef,
} from "pdf-lib";
import { compressImageBytes, compressRawRaster } from "./compressImageBytes";
import {
  COMPRESS_IMAGE_RATIO,
  COMPRESS_MIN_IMAGE_BYTES,
  looksWorthKeeping,
  type CompressedRaster,
  type CompressRasterFn,
} from "./compressUploadShared";

function nameOf(obj: unknown): string {
  if (obj instanceof PDFName) return obj.asString().replace(/^\//, "");
  return "";
}

function filterNames(dict: PDFDict): string[] {
  const filter = dict.lookup(PDFName.of("Filter"));
  if (filter instanceof PDFName) return [nameOf(filter)];
  if (filter instanceof PDFArray) {
    const out: string[] = [];
    for (let i = 0; i < filter.size(); i += 1) {
      const item = filter.lookup(i);
      if (item instanceof PDFName) out.push(nameOf(item));
    }
    return out;
  }
  return [];
}

function dictHasPredictor(dict: PDFDict): boolean {
  const check = (value: unknown): boolean => {
    if (!(value instanceof PDFDict)) return false;
    const pred = value.lookup(PDFName.of("Predictor"));
    return pred instanceof PDFNumber && pred.asNumber() > 1;
  };
  const parms = dict.lookup(PDFName.of("DecodeParms"));
  if (check(parms)) return true;
  if (parms instanceof PDFArray) {
    for (let i = 0; i < parms.size(); i += 1) {
      if (check(parms.lookup(i))) return true;
    }
  }
  return false;
}

function asNumber(obj: unknown): number | null {
  return obj instanceof PDFNumber ? obj.asNumber() : null;
}

function jpegFromStream(stream: PDFRawStream): Uint8Array | null {
  const contents = stream.getContents();
  if (
    contents.length >= COMPRESS_MIN_IMAGE_BYTES &&
    contents[0] === 0xff &&
    contents[1] === 0xd8
  ) {
    return contents;
  }
  const filters = filterNames(stream.dict);
  if (filters.length === 1 && filters[0] === "DCTDecode") {
    return contents.length >= COMPRESS_MIN_IMAGE_BYTES ? contents : null;
  }
  return null;
}

function rawFromStream(
  stream: PDFRawStream,
  width: number,
  height: number
): { pixels: Uint8Array; channels: 1 | 3 } | null {
  if (dictHasPredictor(stream.dict)) return null;
  const filters = filterNames(stream.dict);
  if (filters.some((f) => f !== "FlateDecode")) return null;
  const cs = nameOf(stream.dict.lookup(PDFName.of("ColorSpace")));
  let pixels: Uint8Array;
  try {
    pixels =
      filters.length === 0
        ? stream.getContents()
        : decodePDFRawStream(stream).decode();
  } catch {
    return null;
  }
  if (cs === "DeviceRGB" && pixels.length >= width * height * 3) {
    return { pixels: pixels.subarray(0, width * height * 3), channels: 3 };
  }
  if (cs === "DeviceGray" && pixels.length >= width * height) {
    return { pixels: pixels.subarray(0, width * height), channels: 1 };
  }
  return null;
}

function assignJpeg(
  doc: PDFDocument,
  ref: PDFRef,
  jpeg: CompressedRaster,
  original: PDFRawStream
) {
  const next = doc.context.stream(jpeg.bytes, {
    Type: "XObject",
    Subtype: "Image",
    BitsPerComponent: 8,
    Width: jpeg.width,
    Height: jpeg.height,
    ColorSpace: "DeviceRGB",
    Filter: "DCTDecode",
  });
  const smask = original.dict.get(PDFName.of("SMask"));
  if (smask) next.dict.set(PDFName.of("SMask"), smask);
  const interpolate = original.dict.get(PDFName.of("Interpolate"));
  if (interpolate) next.dict.set(PDFName.of("Interpolate"), interpolate);
  doc.context.assign(ref, next);
}

export async function compressPdfBytes(
  source: ArrayBuffer | Uint8Array,
  compressImage: CompressRasterFn = compressImageBytes
): Promise<Uint8Array | null> {
  const bytes =
    source instanceof Uint8Array ? source : new Uint8Array(source);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  if (doc.isEncrypted) return null;

  const objects = doc.context.enumerateIndirectObjects();
  let changed = 0;

  for (let i = 0; i < objects.length; i += 1) {
    const [ref, obj] = objects[i]!;
    if (!(obj instanceof PDFRawStream)) continue;
    const subtype = obj.dict.lookup(PDFName.of("Subtype"));
    if (subtype !== PDFName.of("Image")) continue;

    const imageMask = obj.dict.lookup(PDFName.of("ImageMask"));
    if (imageMask instanceof PDFBool && imageMask.asBoolean()) continue;
    if (obj.dict.has(PDFName.of("Mask"))) continue;

    const width = asNumber(obj.dict.lookup(PDFName.of("Width")));
    const height = asNumber(obj.dict.lookup(PDFName.of("Height")));
    const bpc = asNumber(obj.dict.lookup(PDFName.of("BitsPerComponent"))) ?? 8;
    if (!width || !height || bpc !== 8) continue;

    const cs = obj.dict.lookup(PDFName.of("ColorSpace"));
    if (cs instanceof PDFName && cs === PDFName.of("DeviceCMYK")) continue;

    const originalSize = obj.getContentsSize();
    if (originalSize < COMPRESS_MIN_IMAGE_BYTES) continue;

    let next: CompressedRaster | null = null;
    const jpeg = jpegFromStream(obj);
    if (jpeg) {
      next = await compressImage({ bytes: jpeg, mime: "image/jpeg" });
    } else {
      const raw = rawFromStream(obj, width, height);
      if (raw) {
        next = await compressRawRaster({
          pixels: raw.pixels,
          width,
          height,
          channels: raw.channels,
        });
      }
    }

    if (
      next &&
      looksWorthKeeping(next.bytes.byteLength, originalSize, COMPRESS_IMAGE_RATIO)
    ) {
      assignJpeg(doc, ref, next, obj);
      changed += 1;
    }

    if (changed > 0 && i % 8 === 7) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  if (changed === 0) return null;
  return doc.save({ useObjectStreams: true });
}
