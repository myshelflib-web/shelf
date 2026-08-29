import {
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import type { Readable } from "node:stream";
import { contentKeyFromPdfKey, getS3Bucket } from "./docPaths.js";
import { buildHtmlFromPdfText, extractPdfText } from "./pdfExtract.js";
import { createS3Client } from "./s3Config.js";
import { errorFields, logger } from "./utils/logger.js";
import { metrics } from "./utils/metrics.js";
import { withRetry } from "./utils/retry.js";

const s3 = createS3Client();
/** pdf.js maps the full file — stay well under 512MB instance RAM. */
const MAX_PDF_BYTES = 24 * 1024 * 1024;

interface ProcessRequest {
  topicId: string;
  pdfKey: string;
  subjectSlug: string;
  topicSlug: string;
  userId?: string;
  type?: "admin" | "user";
}

async function downloadPdf(key: string): Promise<Buffer | null> {
  const response = await withRetry(
    () =>
      s3.send(
        new GetObjectCommand({
          Bucket: getS3Bucket(),
          Key: key,
        })
      ),
    {
      label: "s3.download_pdf",
      attempts: 4,
      delayMs: 300,
      onRetry: () => metrics.inc("s3_retries_total", { op: "get" }),
    }
  );
  const length = response.ContentLength;
    if (length && length > MAX_PDF_BYTES) {
      const body = response.Body as Readable | undefined;
      try {
        body?.destroy?.();
      } catch {
        /* ignore */
      }
      return null;
    }
  const body = response.Body as Readable | undefined;
  if (!body) return Buffer.alloc(0);
  const parts: Buffer[] = [];
  let total = 0;
  for await (const chunk of body) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
    total += buf.length;
    if (total > MAX_PDF_BYTES) {
      body.destroy?.();
      return null;
    }
    parts.push(buf);
  }
  return Buffer.concat(parts, total);
}

async function downloadHtmlIfExists(key: string): Promise<string | null> {
  try {
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: getS3Bucket(),
        Key: key,
      })
    );
    const text = await response.Body?.transformToString();
    return text ?? null;
  } catch {
    return null;
  }
}

async function uploadHtml(key: string, html: string): Promise<void> {
  const body = Buffer.from(html, "utf8");
  await withRetry(
    () =>
      s3.send(
        new PutObjectCommand({
          Bucket: getS3Bucket(),
          Key: key,
          Body: body,
          ContentLength: body.length,
          ContentType: "text/html; charset=utf-8",
        })
      ),
    {
      label: "s3.upload_html",
      attempts: 4,
      delayMs: 300,
      onRetry: () => metrics.inc("s3_retries_total", { op: "put" }),
    }
  );
}

export function htmlExtractIsEmpty(html: string): boolean {
  return html.replace(/\s+/g, "").length === 0;
}

/** Prefer existing OCR / longer HTML over an empty pdf.js extract. */
export function shouldKeepExistingHtml(
  existingHtml: string | null,
  newHtml: string
): boolean {
  if (!existingHtml) return false;
  if (existingHtml.includes('name="shelf-ocr"')) return true;
  const existingLen = existingHtml.replace(/\s+/g, " ").trim().length;
  const newLen = newHtml.replace(/\s+/g, " ").trim().length;
  if (newLen === 0 && existingLen > 0) return true;
  return existingLen > 200 && newLen < Math.max(120, Math.floor(existingLen * 0.35));
}

export async function processPdf(request: ProcessRequest): Promise<{
  html: string;
  toc: Array<{ id: string; title: string }>;
  contentKey: string;
}> {
  const start = Date.now();
  const log = logger.child({
    topicId: request.topicId,
    pdfKey: request.pdfKey,
    type: request.type ?? "admin",
  });

  log.debug("processor.start");

  try {
    let pdfBuffer = await downloadPdf(request.pdfKey);
    if (!pdfBuffer) {
      log.info("processor.skip_large_pdf", { maxBytes: MAX_PDF_BYTES });
      const contentKey = contentKeyFromPdfKey(request.pdfKey);
      return { html: "", toc: [], contentKey };
    }
    metrics.inc("s3_ops_total", { op: "get", ok: true });
    log.debug("processor.pdf_downloaded", { bytes: pdfBuffer.length });

    const parsed = await extractPdfText(pdfBuffer);
    pdfBuffer = Buffer.alloc(0);
    const { html: indexedHtml, toc } = buildHtmlFromPdfText(parsed.text);

    const contentKey = contentKeyFromPdfKey(request.pdfKey);
    const existingHtml = await downloadHtmlIfExists(contentKey);
    const keepExisting = shouldKeepExistingHtml(existingHtml, indexedHtml);
    const emptyExtract = htmlExtractIsEmpty(indexedHtml);
    const htmlToWrite = keepExisting ? existingHtml! : indexedHtml;

    if (keepExisting) {
      log.info("processor.keep_existing_html", {
        contentKey,
        reason: existingHtml?.includes('name="shelf-ocr"')
          ? "shelf-ocr"
          : "richer-than-extract",
      });
    } else if (emptyExtract) {
      // Empty string Body makes AWS SDK warn and can overwrite good HTML with 0 bytes.
      log.info("processor.skip_empty_html", {
        contentKey,
        pages: parsed.numpages,
      });
    } else {
      await uploadHtml(contentKey, indexedHtml);
      metrics.inc("s3_ops_total", { op: "put", ok: true });
    }

    const durationMs = Date.now() - start;
    metrics.observe("processor_duration_ms", durationMs, {
      type: request.type ?? "admin",
      ok: true,
    });
    log.info("processor.ok", {
      contentKey,
      pages: parsed.numpages,
      tocCount: toc.length,
      htmlBytes: htmlToWrite.length,
      keptExisting: keepExisting,
      durationMs,
    });

    return { html: htmlToWrite, toc, contentKey };
  } catch (err) {
    metrics.observe("processor_duration_ms", Date.now() - start, {
      type: request.type ?? "admin",
      ok: false,
    });
    log.error("processor.failed", errorFields(err));
    throw err;
  }
}
