import { PDFDocument } from "pdf-lib";

/** Remove 1-based page numbers from a PDF; keeps at least one page. */
export async function removePdfPages(
  source: ArrayBuffer,
  deletedPages: ReadonlyArray<number>
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(source, { ignoreEncryption: true });
  const total = doc.getPageCount();
  if (total < 1) throw new Error("PDF has no pages");

  const toRemove = [
    ...new Set(
      deletedPages.filter((n) => Number.isInteger(n) && n >= 1 && n <= total)
    ),
  ].sort((a, b) => b - a);

  if (toRemove.length === 0) throw new Error("No pages selected");
  if (toRemove.length >= total) {
    throw new Error("Keep at least one page");
  }

  for (const pageNum of toRemove) {
    doc.removePage(pageNum - 1);
  }

  return doc.save();
}
