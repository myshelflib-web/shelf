import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { removePdfPages } from "./removePdfPages";

async function blankPdf(pages: number): Promise<ArrayBuffer> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([200, 280]);
  const u8 = await doc.save();
  return u8.buffer.slice(
    u8.byteOffset,
    u8.byteOffset + u8.byteLength
  ) as ArrayBuffer;
}

describe("removePdfPages", () => {
  it("removes selected pages and keeps order", async () => {
    const src = await blankPdf(4);
    const out = await removePdfPages(src, [2, 4]);
    const doc = await PDFDocument.load(out);
    expect(doc.getPageCount()).toBe(2);
  });

  it("rejects deleting every page", async () => {
    const src = await blankPdf(2);
    await expect(removePdfPages(src, [1, 2])).rejects.toThrow(/at least one/i);
  });
});
