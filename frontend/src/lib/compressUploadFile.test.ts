import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { strFromU8, unzipSync, zipSync } from "fflate";
import { compressDocxBytes } from "./compressDocxForUpload";
import { compressPdfBytes } from "./compressPdfForUpload";
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

async function pdfWithImageStream(payload: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([200, 280]);
  doc.context.register(
    doc.context.stream(payload, {
      Type: "XObject",
      Subtype: "Image",
      Width: 1600,
      Height: 1200,
      BitsPerComponent: 8,
      ColorSpace: "DeviceRGB",
      Filter: "DCTDecode",
    })
  );
  return doc.save();
}

describe("compressUploadFile", () => {
  it("leaves small files and text documents unchanged", async () => {
    const txt = new File(["hello notes"], "notes.txt", { type: "text/plain" });
    expect(await compressUploadFile(txt)).toBe(txt);

    const small = new File([fakeJpeg(1024)], "tiny.pdf", {
      type: "application/pdf",
    });
    expect(small.size).toBeLessThan(COMPRESS_MIN_FILE_BYTES);
    expect(await compressUploadFile(small)).toBe(small);
    expect(shouldCompressUpload(small)).toBe(false);
    expect(shouldCompressUpload(txt)).toBe(false);
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
  it("keeps page count and skips when nothing shrinks", async () => {
    const src = await pdfWithImageStream(fakeJpeg(30 * 1024));
    const out = await compressPdfBytes(src, async () => null);
    expect(out).toBeNull();
  });

  it("rewrites jpeg xobjects when the compressor shrinks them", async () => {
    const src = await pdfWithImageStream(fakeJpeg(40 * 1024));
    let called = 0;
    const out = await compressPdfBytes(src, async () => {
      called += 1;
      return { bytes: fakeJpeg(800), width: 400, height: 300 };
    });
    expect(called).toBeGreaterThan(0);
    expect(out).not.toBeNull();
    expect(out!.byteLength).toBeLessThan(src.byteLength);
    const loaded = await PDFDocument.load(out!);
    expect(loaded.getPageCount()).toBe(1);
  });
});

describe("compressDocxBytes", () => {
  it("recompresses word/media jpeg parts and updates content types", async () => {
    const original = zipSync({
      "[Content_Types].xml": new TextEncoder().encode(
        `<?xml version="1.0"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
      ),
      "word/document.xml": new TextEncoder().encode(
        `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"></w:document>`
      ),
      "word/media/photo.jpeg": fakeJpeg(50 * 1024),
    });

    const out = await compressDocxBytes(original, async () => ({
      bytes: fakeJpeg(1200),
      width: 400,
      height: 300,
    }));
    expect(out).not.toBeNull();
    expect(out!.byteLength).toBeLessThan(original.byteLength);
    const entries = unzipSync(out!);
    expect(entries["word/media/photo.jpeg"]?.byteLength).toBe(1200);
    const types = strFromU8(entries["[Content_Types].xml"]!);
    expect(types).toContain('PartName="/word/media/photo.jpeg"');
    expect(types).toContain("image/jpeg");
  });

  it("returns null when media cannot shrink", async () => {
    const original = zipSync({
      "word/document.xml": new TextEncoder().encode("<w:document/>"),
      "word/media/photo.jpeg": fakeJpeg(50 * 1024),
    });
    const out = await compressDocxBytes(original, async () => null);
    expect(out).toBeNull();
  });
});
