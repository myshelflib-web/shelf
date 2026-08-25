import type * as pdfjs from "pdfjs-dist";
import type { PdfPagePx } from "./pdfLayout";

/** IntersectionObserver prefetch margin for PDF page paint + size probe. */
export const PDF_IO_ROOT_MARGIN = "400px 0px";

export function pdfResumePage(
  initialPage: number | undefined,
  numPages: number
): number {
  if (numPages <= 0) return 1;
  return Math.min(Math.max(1, initialPage ?? 1), numPages);
}

/** Pages to measure on open: saved page plus one above and below. */
export function pdfInitialProbePages(
  startPage: number,
  numPages: number
): number[] {
  const pages = [startPage];
  if (startPage > 1) pages.push(startPage - 1);
  if (startPage < numPages) pages.push(startPage + 1);
  return pages;
}

export async function probePdfPageSize(
  doc: pdfjs.PDFDocumentProxy,
  pageNum: number
): Promise<PdfPagePx> {
  const page = await doc.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1 });
  return { w: viewport.width, h: viewport.height };
}
