import {
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { contentKeyFromPdfKey, getS3Bucket } from "./docPaths.js";
import { buildHtmlFromPdfText, extractPdfText } from "./pdfExtract.js";
import { createS3Client } from "./s3Config.js";
import { errorFields, logger } from "./utils/logger.js";
import { metrics } from "./utils/metrics.js";
import { withRetry } from "./utils/retry.js";

const s3 = createS3Client();

interface ProcessRequest {
  topicId: string;
  pdfKey: string;
  subjectSlug: string;
  topicSlug: string;
  userId?: string;
  type?: "admin" | "user";
}

async function downloadPdf(key: string): Promise<Buffer> {
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
  const bytes = await response.Body?.transformToByteArray();
  return Buffer.from(bytes!);
}

async function uploadHtml(key: string, html: string): Promise<void> {
  await withRetry(
    () =>
      s3.send(
        new PutObjectCommand({
          Bucket: getS3Bucket(),
          Key: key,
          Body: html,
          ContentType: "text/html",
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
    const pdfBuffer = await downloadPdf(request.pdfKey);
    metrics.inc("s3_ops_total", { op: "get", ok: true });
    log.debug("processor.pdf_downloaded", { bytes: pdfBuffer.length });

    const parsed = await extractPdfText(pdfBuffer);
    const { html: indexedHtml, toc } = buildHtmlFromPdfText(parsed.text);

    const contentKey = contentKeyFromPdfKey(request.pdfKey);
    await uploadHtml(contentKey, indexedHtml);
    metrics.inc("s3_ops_total", { op: "put", ok: true });

    const durationMs = Date.now() - start;
    metrics.observe("processor_duration_ms", durationMs, {
      type: request.type ?? "admin",
      ok: true,
    });
    log.info("processor.ok", {
      contentKey,
      pages: parsed.numpages,
      tocCount: toc.length,
      htmlBytes: indexedHtml.length,
      durationMs,
    });

    return { html: indexedHtml, toc, contentKey };
  } catch (err) {
    metrics.observe("processor_duration_ms", Date.now() - start, {
      type: request.type ?? "admin",
      ok: false,
    });
    log.error("processor.failed", errorFields(err));
    throw err;
  }
}
