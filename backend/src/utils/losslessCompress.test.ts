import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { zipSync, zlibSync } from "fflate";
import {
  detectCompressKind,
  losslessCompressBuffer,
} from "./losslessCompress.js";

function rgbRaw(width: number, height: number): Uint8Array {
  const row = 1 + width * 3;
  const raw = new Uint8Array(row * height);
  for (let y = 0; y < height; y += 1) {
    const o = y * row;
    raw[o] = 0;
    for (let x = 0; x < width; x += 1) {
      raw[o + 1 + x * 3] = x & 255;
      raw[o + 2 + x * 3] = y & 255;
      raw[o + 3 + x * 3] = 90;
    }
  }
  return raw;
}

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let x = n;
    for (let k = 0; k < 8; k += 1) {
      x = x & 1 ? 0xedb88320 ^ (x >>> 1) : x >>> 1;
    }
    table[n] = x >>> 0;
  }
  for (let i = 0; i < bytes.length; i += 1) {
    c = table[(c ^ bytes[i]!) & 255]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.byteLength);
  const len = data.byteLength;
  out[0] = (len >>> 24) & 255;
  out[1] = (len >>> 16) & 255;
  out[2] = (len >>> 8) & 255;
  out[3] = len & 255;
  out[4] = type.charCodeAt(0);
  out[5] = type.charCodeAt(1);
  out[6] = type.charCodeAt(2);
  out[7] = type.charCodeAt(3);
  out.set(data, 8);
  const crc = crc32(out.subarray(4, 8 + data.byteLength));
  const c = 8 + data.byteLength;
  out[c] = (crc >>> 24) & 255;
  out[c + 1] = (crc >>> 16) & 255;
  out[c + 2] = (crc >>> 8) & 255;
  out[c + 3] = crc & 255;
  return out;
}

function pngLevel0(width: number, height: number): Buffer {
  const ihdr = new Uint8Array(13);
  ihdr[2] = (width >>> 8) & 255;
  ihdr[3] = width & 255;
  ihdr[6] = (height >>> 8) & 255;
  ihdr[7] = height & 255;
  ihdr[8] = 8;
  ihdr[9] = 2;
  const idat = zlibSync(rgbRaw(width, height), { level: 0 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    Buffer.from(chunk("IHDR", ihdr)),
    Buffer.from(chunk("IDAT", idat)),
    Buffer.from(chunk("IEND", new Uint8Array(0))),
  ]);
}

describe("detectCompressKind", () => {
  it("classifies pdf, png, and docx", () => {
    expect(detectCompressKind("application/pdf")).toBe("pdf");
    expect(detectCompressKind("image/png", "a.png")).toBe("png");
    expect(
      detectCompressKind(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
    ).toBe("zip");
    expect(detectCompressKind("image/jpeg")).toBe("skip");
    expect(detectCompressKind("text/plain", "notes.txt")).toBe("skip");
  });
});

describe("losslessCompressBuffer", () => {
  it("packs an uncompressed PDF stream", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 280]);
    const payload = new Uint8Array(8 * 1024);
    payload.fill(9);
    doc.context.register(
      doc.context.stream(payload, {
        Type: "XObject",
        Subtype: "Image",
        Width: 32,
        Height: 32,
        BitsPerComponent: 8,
        ColorSpace: "DeviceGray",
      })
    );
    const src = Buffer.from(await doc.save({ useObjectStreams: false }));
    const out = await losslessCompressBuffer(src, "application/pdf");
    expect(out.length).toBeLessThan(src.length);
    const loaded = await PDFDocument.load(out);
    expect(loaded.getPageCount()).toBe(1);
  });

  it("recompresses a level-0 PNG", async () => {
    const src = pngLevel0(40, 40);
    const out = await losslessCompressBuffer(src, "image/png");
    expect(out.length).toBeLessThan(src.length);
  });

  it("re-deflates a store-level zip", async () => {
    const src = Buffer.from(
      zipSync(
        {
          "word/document.xml": new TextEncoder().encode(
            `<doc>${"paragraph ".repeat(1500)}</doc>`
          ),
        },
        { level: 0 }
      )
    );
    const out = await losslessCompressBuffer(src, "application/zip", "notes.docx");
    expect(out.length).toBeLessThan(src.length);
  });

  it("leaves jpeg and text unchanged", async () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9, ...Array(2000).fill(1)]);
    expect(await losslessCompressBuffer(jpeg, "image/jpeg")).toBe(jpeg);
    const txt = Buffer.from("hello notes");
    expect(await losslessCompressBuffer(txt, "text/plain", "a.txt")).toBe(txt);
  });
});
