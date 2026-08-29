import type { Readable } from "node:stream";
import {
  getDocument,
  PDFDataRangeTransport,
} from "pdfjs-dist/legacy/build/pdf.mjs";
import { contentKeyFromPdfKey } from "../utils/docPaths.js";
import { getObjectStream, headObjectMeta, uploadToS3 } from "./s3.js";
import { logger, errorFields } from "../utils/logger.js";
import { renderPdfPageToJpeg } from "./libraryIndexPdfRender.js";
import {
  buildShelfOcrHtml,
  ocrJpegBuffer,
  pdfOcrEnabled,
  pdfPageNeedsOcr,
} from "./pdfOcr.js";

const RANGE_CHUNK_SIZE = 64 * 1024;
/** Abort a single Range GET bigger than this so we never buffer a whole PDF. */
const MAX_RANGE_BYTES = Number(process.env.VECTOR_INDEX_PDF_RANGE_MAX ?? 2 * 1024 * 1024);
/**
 * pdf.js still allocates a Uint8Array(fileLength) while we Range-GET page chunks.
 * 64MB is a last-resort cap on 512MB hosts — not a 12MB skip of normal textbooks.
 */
const MAX_PDF_FILE_BYTES = Number(
  process.env.VECTOR_INDEX_PDF_MAX_BYTES ?? 64 * 1024 * 1024
);
const MAX_PDF_PAGES = Number(process.env.VECTOR_INDEX_PDF_PAGES ?? 40);
const MAX_PDF_CHARS = Number(process.env.VECTOR_INDEX_PDF_CHARS ?? 80_000);
const MAX_OCR_PAGES = Number(process.env.VECTOR_INDEX_OCR_PAGES ?? 12);

function envPositive(n: number, fallback: number): number {
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function pdfIndexRangeTooLarge(byteCount: number): boolean {
  return byteCount > envPositive(MAX_RANGE_BYTES, 2 * 1024 * 1024);
}

export function pdfIndexFileTooLarge(contentLength: number): boolean {
  return contentLength > envPositive(MAX_PDF_FILE_BYTES, 64 * 1024 * 1024);
}

export type PdfTextItem = { str?: string; transform?: number[] };

/** Join pdf.js text items into lines (same geometry rule as relevancy extract). */
export function pdfTextItemsToLines(items: PdfTextItem[]): string[] {
  const pageLines: string[] = [];
  let lastY: number | null = null;
  let line = "";

  for (const item of items) {
    if (!item.str) continue;
    const y = Math.round(item.transform?.[5] ?? 0);
    if (lastY !== null && Math.abs(y - lastY) > 3) {
      if (line.trim()) pageLines.push(line.trim());
      line = "";
    }
    const str = String(item.str);
    if (
      line &&
      !line.endsWith(" ") &&
      !str.startsWith(" ") &&
      !/^[,.;:!?)]/.test(str)
    ) {
      line += " ";
    }
    line += str;
    lastY = y;
  }
  if (line.trim()) pageLines.push(line.trim());
  return pageLines;
}

async function readableToBuffer(body: Readable): Promise<Buffer> {
  const parts: Buffer[] = [];
  for await (const chunk of body) {
    parts.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array));
  }
  return Buffer.concat(parts);
}

async function readS3Range(
  key: string,
  begin: number,
  endExclusive: number
): Promise<Uint8Array> {
  const size = endExclusive - begin;
  if (size <= 0) return new Uint8Array(0);
  if (pdfIndexRangeTooLarge(size)) {
    throw new Error(`PDF range too large (${size} bytes)`);
  }
  const { body } = await getObjectStream(key, {
    range: `bytes=${begin}-${endExclusive - 1}`,
  });
  const buf = await readableToBuffer(body);
  return new Uint8Array(buf);
}

class S3PdfRangeTransport extends PDFDataRangeTransport {
  private cancelled = false;

  constructor(
    private readonly key: string,
    length: number
  ) {
    super(length, new Uint8Array(0), false);
  }

  abort(): void {
    this.cancelled = true;
  }

  requestDataRange(begin: number, end: number): void {
    if (this.cancelled) return;
    void readS3Range(this.key, begin, end)
      .then((chunk) => {
        if (this.cancelled) return;
        this.onDataRange(begin, chunk);
      })
      .catch((err) => {
        if (this.cancelled) return;
        logger.warn("library_index.pdf_range_failed", {
          key: this.key,
          begin,
          end,
          ...errorFields(err),
        });
        this.abort();
      });
  }
}

function yieldEventLoop(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

async function persistOcrHtml(pdfKey: string, text: string): Promise<void> {
  const key = contentKeyFromPdfKey(pdfKey);
  try {
    await uploadToS3(
      key,
      Buffer.from(buildShelfOcrHtml(text), "utf8"),
      "text/html; charset=utf-8"
    );
    logger.info("library_index.ocr_html_saved", { key });
  } catch (err) {
    logger.warn("library_index.ocr_html_save_failed", {
      key,
      ...errorFields(err),
    });
  }
}

/**
 * Pull text from `source.pdf` via S3 Range GETs + pdf.js page-at-a-time.
 * Does not `GetObject` the whole file. Stops after enough chars/pages for embed.
 */
export async function extractPdfTextByRanges(pdfKey: string): Promise<string> {
  const maxPages = envPositive(MAX_PDF_PAGES, 40);
  const maxChars = envPositive(MAX_PDF_CHARS, 80_000);
  const maxOcr = envPositive(MAX_OCR_PAGES, 12);

  let meta;
  try {
    meta = await headObjectMeta(pdfKey);
  } catch (err) {
    logger.debug("library_index.pdf_head_miss", {
      key: pdfKey,
      ...errorFields(err),
    });
    return "";
  }
  if (!meta.contentLength) return "";
  if (pdfIndexFileTooLarge(meta.contentLength)) {
    logger.info("library_index.pdf_skip_large", {
      key: pdfKey,
      fileBytes: meta.contentLength,
    });
    return "";
  }

  const transport = new S3PdfRangeTransport(pdfKey, meta.contentLength);
  let doc: Awaited<ReturnType<typeof getDocument>["promise"]> | null = null;

  try {
    doc = await getDocument({
      length: meta.contentLength,
      range: transport,
      rangeChunkSize: RANGE_CHUNK_SIZE,
      disableStream: true,
      disableAutoFetch: true,
      disableRange: false,
      useSystemFonts: true,
      isEvalSupported: false,
      verbosity: 0,
    }).promise;

    const pages = Math.min(doc.numPages, maxPages);
    const lines: string[] = [];
    let chars = 0;
    let ocrPages = 0;

    for (let pageNum = 1; pageNum <= pages; pageNum++) {
      const page = await doc.getPage(pageNum);
      try {
        const content = await page.getTextContent();
        const pageLines = pdfTextItemsToLines(
          content.items as PdfTextItem[]
        );
        let pageText = pageLines.join("\n").trim();
        if (
          pdfPageNeedsOcr(pageText) &&
          ocrPages < maxOcr &&
          pdfOcrEnabled()
        ) {
          try {
            const jpeg = await renderPdfPageToJpeg(
              page as unknown as Parameters<typeof renderPdfPageToJpeg>[0]
            );
            const ocr = jpeg ? await ocrJpegBuffer(jpeg) : null;
            if (ocr) {
              pageText = ocr;
              ocrPages += 1;
            }
          } catch (err) {
            logger.warn("library_index.pdf_ocr_page_failed", {
              key: pdfKey,
              pageNum,
              ...errorFields(err),
            });
          }
        }
        if (pageText) {
          if (chars >= maxChars) break;
          lines.push(pageText);
          chars += pageText.length + 1;
        }
      } finally {
        page.cleanup();
      }
      if (chars >= maxChars) break;
      await yieldEventLoop();
    }

    const text = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    logger.info("library_index.pdf_ranged", {
      key: pdfKey,
      pages,
      ocrPages,
      chars: text.length,
      fileBytes: meta.contentLength,
    });
    if (ocrPages > 0 && text) {
      await persistOcrHtml(pdfKey, text);
    }
    return text;
  } catch (err) {
    logger.warn("library_index.pdf_ranged_failed", {
      key: pdfKey,
      ...errorFields(err),
    });
    return "";
  } finally {
    try {
      await doc?.destroy();
    } catch {
      /* ignore */
    }
    try {
      transport.abort();
    } catch {
      /* ignore */
    }
  }
}
