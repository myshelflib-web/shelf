import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { unzipSync, zipSync, zlibSync } from "fflate";
import { compressDocxBytes } from "./compressDocxForUpload";
import { compressPdfBytes } from "./compressPdfForUpload";
import { compressPngBytes } from "./compressPngLossless";
import { rebuildPngWithIdat, pngIdatPayload } from "./pngChunks";
import { compressUploadFile, shouldCompressUpload } from "./compressUploadFile";
import { COMPRESS_MIN_FILE_BYTES } from "./compressUploadShared";

function fakeJpeg(byteLength: number): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(byteLength);
  out[0] = 0xff;
  out[1] = 0xd8;
  out[2] = 0xff;
  out[3] = 0xda;
  out[out.length - 2] = 0xff;
  out[out.length - 1] = 0xd9;
  return out;
}

function rgbPngRaw(width: number, height: number): Uint8Array {
  const row = 1 + width * 3;
  const raw = new Uint8Array(row * height);
  for (let y = 0; y < height; y += 1) {
    const o = y * row;
    raw[o] = 0;
    for (let x = 0; x < width; x += 1) {
      raw[o + 1 + x * 3] = x & 255;
      raw[o + 2 + x * 3] = y & 255;
      raw[o + 3 + x * 3] = 80;
    }
  }
  return raw;
}

function pngFromRaw(raw: Uint8Array, width: number, height: number, level: 0 | 9) {
  const ihdr = new Uint8Array(13);
  ihdr[0] = (width >>> 24) & 255;
  ihdr[1] = (width >>> 16) & 255;
  ihdr[2] = (width >>> 8) & 255;
  ihdr[3] = width & 255;
  ihdr[4] = (height >>> 24) & 255;
  ihdr[5] = (height >>> 16) & 255;
  ihdr[6] = (height >>> 8) & 255;
  ihdr[7] = height & 255;
  ihdr[8] = 8;
  ihdr[9] = 2;
  const idat = zlibSync(raw, { level });
  const built = rebuildPngWithIdat(
    [
      { type: "IHDR", data: ihdr },
      { type: "IDAT", data: new Uint8Array(0) },
      { type: "IEND", data: new Uint8Array(0) },
    ],
    idat
  );
  if (!built) throw new Error("png build failed");
  return built;
}

describe("compressUploadFile", () => {
  it("leaves small files, text, and jpeg unchanged", async () => {
    const txt = new File(["hello notes"], "notes.txt", { type: "text/plain" });
    expect(await compressUploadFile(txt)).toBe(txt);
    expect(shouldCompressUpload(txt)).toBe(false);

    const jpeg = new File([fakeJpeg(COMPRESS_MIN_FILE_BYTES + 8)], "shot.jpg", {
      type: "image/jpeg",
    });
    expect(shouldCompressUpload(jpeg)).toBe(false);
    expect(await compressUploadFile(jpeg)).toBe(jpeg);

    const small = new File([fakeJpeg(1024)], "tiny.pdf", {
      type: "application/pdf",
    });
    expect(shouldCompressUpload(small)).toBe(false);
    expect(await compressUploadFile(small)).toBe(small);
  });

  it("returns the original PDF when parsing fails", async () => {
    const junk = new Uint8Array(COMPRESS_MIN_FILE_BYTES + 8);
    junk.set([0x25, 0x21, 0x50, 0x53]);
    const file = new File([junk.buffer], "broken.pdf", {
      type: "application/pdf",
    });
    expect(await compressUploadFile(file)).toBe(file);
  });
});

describe("compressPdfBytes", () => {
  it("packs uncompressed streams losslessly and keeps page count", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 280]);
    const payload = new Uint8Array(8 * 1024);
    payload.fill(7);
    const ref = doc.context.register(
      doc.context.stream(payload, {
        Type: "XObject",
        Subtype: "Image",
        Width: 32,
        Height: 32,
        BitsPerComponent: 8,
        ColorSpace: "DeviceGray",
      })
    );
    const src = await doc.save({ useObjectStreams: false });
    const out = await compressPdfBytes(src);
    expect(out).not.toBeNull();
    expect(out!.byteLength).toBeLessThan(src.byteLength);
    const loaded = await PDFDocument.load(out!);
    expect(loaded.getPageCount()).toBe(1);
    const packed = loaded.context.lookup(ref);
    expect(packed).toBeTruthy();
  });
});

describe("compressPngBytes", () => {
  it("recompresses a level-0 IDAT without changing pixels", () => {
    const raw = rgbPngRaw(48, 48);
    const fat = pngFromRaw(raw, 48, 48, 0);
    const out = compressPngBytes(fat);
    expect(out).not.toBeNull();
    expect(out!.byteLength).toBeLessThan(fat.byteLength);
    const parsed = pngIdatPayload(out!);
    expect(parsed).not.toBeNull();
  });
});

describe("compressDocxBytes", () => {
  it("re-deflates a store-level zip", () => {
    const original = zipSync(
      {
        "[Content_Types].xml": new TextEncoder().encode(
          `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>`
        ),
        "word/document.xml": new TextEncoder().encode(
          `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">${"note ".repeat(2000)}</w:document>`
        ),
      },
      { level: 0 }
    );
    const out = compressDocxBytes(original);
    expect(out).not.toBeNull();
    expect(out!.byteLength).toBeLessThan(original.byteLength);
    const entries = unzipSync(out!);
    expect(Object.keys(entries)).toContain("word/document.xml");
  });
});
