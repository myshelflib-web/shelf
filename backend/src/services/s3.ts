import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Readable } from "node:stream";
import {
  browserS3Endpoint,
  createS3Client,
  isR2Endpoint,
} from "./s3Config.js";
import { withRetry } from "../utils/retry.js";
import { metrics } from "../utils/metrics.js";
import { errorFields, logger } from "../utils/logger.js";

const s3 = createS3Client();
const browserS3 = createS3Client(browserS3Endpoint());

/** Single bucket for all doc folders (PDF + HTML). Falls back to legacy env vars. */
export function getS3Bucket(): string {
  return (
    process.env.S3_BUCKET ??
    process.env.S3_CONTENT_BUCKET ??
    process.env.S3_PDF_BUCKET ??
    "upsc-docs"
  );
}

export async function uploadToS3(
  key: string,
  body: Buffer | string,
  contentType: string,
  bucket = getS3Bucket()
): Promise<string> {
  const start = Date.now();
  try {
    await withRetry(
      () =>
        s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
          })
        ),
      {
        label: "s3.upload",
        attempts: 4,
        delayMs: 250,
        onRetry: () => metrics.inc("s3_retries_total", { op: "upload" }),
      }
    );
    metrics.inc("s3_ops_total", { op: "upload", ok: true });
    metrics.observe("s3_op_duration_ms", Date.now() - start, {
      op: "upload",
      ok: true,
    });
    logger.debug("s3.upload.ok", { key, bucket, contentType });
    return key;
  } catch (err) {
    metrics.inc("s3_ops_total", { op: "upload", ok: false });
    metrics.observe("s3_op_duration_ms", Date.now() - start, {
      op: "upload",
      ok: false,
    });
    logger.error("s3.upload.failed", { key, bucket, ...errorFields(err) });
    throw err;
  }
}

export async function getFromS3(
  key: string,
  bucket = getS3Bucket()
): Promise<string> {
  const start = Date.now();
  try {
    const response = await withRetry(
      () => s3.send(new GetObjectCommand({ Bucket: bucket, Key: key })),
      {
        label: "s3.get",
        attempts: 4,
        delayMs: 250,
        onRetry: () => metrics.inc("s3_retries_total", { op: "get" }),
      }
    );
    const body = (await response.Body?.transformToString()) ?? "";
    metrics.inc("s3_ops_total", { op: "get", ok: true });
    metrics.observe("s3_op_duration_ms", Date.now() - start, {
      op: "get",
      ok: true,
    });
    logger.debug("s3.get.ok", { key, bucket, bytes: body.length });
    return body;
  } catch (err) {
    metrics.inc("s3_ops_total", { op: "get", ok: false });
    metrics.observe("s3_op_duration_ms", Date.now() - start, {
      op: "get",
      ok: false,
    });
    logger.error("s3.get.failed", { key, bucket, ...errorFields(err) });
    throw err;
  }
}

export async function getObjectBuffer(
  key: string,
  bucket = getS3Bucket()
): Promise<{ buffer: Buffer; contentType: string }> {
  const start = Date.now();
  try {
    const response = await withRetry(
      () => s3.send(new GetObjectCommand({ Bucket: bucket, Key: key })),
      {
        label: "s3.get_buffer",
        attempts: 4,
        delayMs: 250,
        onRetry: () => metrics.inc("s3_retries_total", { op: "get" }),
      }
    );
    const bytes = await response.Body?.transformToByteArray();
    const buffer = Buffer.from(bytes ?? []);
    metrics.inc("s3_ops_total", { op: "get", ok: true });
    metrics.observe("s3_op_duration_ms", Date.now() - start, {
      op: "get",
      ok: true,
    });
    logger.debug("s3.get_buffer.ok", { key, bucket, bytes: buffer.length });
    return {
      buffer,
      contentType: response.ContentType ?? "application/octet-stream",
    };
  } catch (err) {
    metrics.inc("s3_ops_total", { op: "get", ok: false });
    metrics.observe("s3_op_duration_ms", Date.now() - start, {
      op: "get",
      ok: false,
    });
    logger.error("s3.get_buffer.failed", { key, bucket, ...errorFields(err) });
    throw err;
  }
}

export async function headObjectMeta(
  key: string,
  bucket = getS3Bucket()
): Promise<{ contentLength: number; contentType: string; etag: string | null }> {
  const start = Date.now();
  try {
    const response = await withRetry(
      () => s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key })),
      {
        label: "s3.head",
        attempts: 3,
        delayMs: 200,
        onRetry: () => metrics.inc("s3_retries_total", { op: "head" }),
      }
    );
    metrics.inc("s3_ops_total", { op: "head", ok: true });
    metrics.observe("s3_op_duration_ms", Date.now() - start, {
      op: "head",
      ok: true,
    });
    return {
      contentLength: response.ContentLength ?? 0,
      contentType: response.ContentType ?? "application/octet-stream",
      etag: response.ETag ? response.ETag.replace(/"/g, "") : null,
    };
  } catch (err) {
    metrics.inc("s3_ops_total", { op: "head", ok: false });
    metrics.observe("s3_op_duration_ms", Date.now() - start, {
      op: "head",
      ok: false,
    });
    logger.error("s3.head.failed", { key, bucket, ...errorFields(err) });
    throw err;
  }
}

/** Stream an object (optionally a byte range) from S3 without buffering the whole file. */
export async function getObjectStream(
  key: string,
  opts?: { range?: string },
  bucket = getS3Bucket()
): Promise<{
  body: Readable;
  contentType: string;
  contentLength?: number;
  contentRange?: string;
  statusCode: number;
}> {
  const start = Date.now();
  try {
    const response = await withRetry(
      () =>
        s3.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
            Range: opts?.range,
          })
        ),
      {
        label: opts?.range ? "s3.get_range" : "s3.get_stream",
        attempts: 4,
        delayMs: 250,
        onRetry: () =>
          metrics.inc("s3_retries_total", {
            op: opts?.range ? "get_range" : "get",
          }),
      }
    );
    const body = response.Body;
    if (!body) {
      throw new Error("S3 object body is empty");
    }

    // Node SDK usually returns a Readable; fall back to buffering if not pipeable.
    let stream: Readable;
    if (typeof (body as Readable).pipe === "function") {
      stream = body as Readable;
    } else {
      const { Readable: NodeReadable } = await import("node:stream");
      const bytes = await body.transformToByteArray();
      stream = NodeReadable.from([Buffer.from(bytes)]);
    }

    metrics.inc("s3_ops_total", {
      op: opts?.range ? "get_range" : "get",
      ok: true,
    });
    metrics.observe("s3_op_duration_ms", Date.now() - start, {
      op: opts?.range ? "get_range" : "get",
      ok: true,
    });
    return {
      body: stream,
      contentType: response.ContentType ?? "application/octet-stream",
      contentLength: response.ContentLength,
      contentRange: response.ContentRange,
      statusCode: opts?.range ? 206 : 200,
    };
  } catch (err) {
    metrics.inc("s3_ops_total", {
      op: opts?.range ? "get_range" : "get",
      ok: false,
    });
    metrics.observe("s3_op_duration_ms", Date.now() - start, {
      op: opts?.range ? "get_range" : "get",
      ok: false,
    });
    logger.error("s3.get_stream.failed", {
      key,
      bucket,
      range: opts?.range ?? null,
      ...errorFields(err),
    });
    throw err;
  }
}

export async function deleteFromS3(
  key: string,
  bucket = getS3Bucket()
): Promise<void> {
  const start = Date.now();
  try {
    await withRetry(
      () => s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })),
      {
        label: "s3.delete",
        attempts: 3,
        delayMs: 200,
        onRetry: () => metrics.inc("s3_retries_total", { op: "delete" }),
      }
    );
    metrics.inc("s3_ops_total", { op: "delete", ok: true });
    metrics.observe("s3_op_duration_ms", Date.now() - start, {
      op: "delete",
      ok: true,
    });
    logger.debug("s3.delete.ok", { key, bucket });
  } catch (err) {
    metrics.inc("s3_ops_total", { op: "delete", ok: false });
    metrics.observe("s3_op_duration_ms", Date.now() - start, {
      op: "delete",
      ok: false,
    });
    logger.error("s3.delete.failed", { key, bucket, ...errorFields(err) });
    throw err;
  }
}

export async function getPresignedUrl(
  key: string,
  expiresIn = 3600,
  bucket = getS3Bucket()
): Promise<string> {
  return getSignedUrl(
    browserS3,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn }
  );
}

/** Browser Range-reads a PDF without sending bytes through the API. */
export const PDF_PRESIGN_EXPIRES_SEC = 12 * 60 * 60;

export async function getPresignedPdfGetUrl(key: string): Promise<string> {
  return getPresignedUrl(key, PDF_PRESIGN_EXPIRES_SEC);
}

/** Browser PUT — bytes never pass through the API. */
export async function getPresignedPutUrl(
  key: string,
  contentType: string,
  expiresIn = 900,
  bucket = getS3Bucket()
): Promise<string> {
  return getSignedUrl(
    browserS3,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn }
  );
}

export async function getObjectPrefix(
  key: string,
  bytes: number,
  bucket = getS3Bucket()
): Promise<Buffer> {
  const { body } = await getObjectStream(
    key,
    { range: `bytes=0-${Math.max(0, bytes - 1)}` },
    bucket
  );
  const chunks: Buffer[] = [];
  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/** Best-effort CORS so the browser can PUT/GET to MinIO / R2. */
export async function ensureBucketCors(): Promise<void> {
  const origins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  if (!origins.length) return;
  await s3.send(
    new PutBucketCorsCommand({
      Bucket: getS3Bucket(),
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: origins,
            AllowedMethods: ["GET", "PUT", "HEAD"],
            AllowedHeaders: ["*", "Range", "Content-Type"],
            ExposeHeaders: [
              "ETag",
              "Content-Length",
              "Content-Type",
              "Content-Range",
              "Accept-Ranges",
            ],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    })
  );
}

export function getPublicContentUrl(key: string): string {
  // R2 buckets are private by default — content is served via the backend API, not direct URLs
  if (isR2Endpoint(process.env.S3_ENDPOINT)) {
    return key;
  }
  const endpoint = process.env.S3_ENDPOINT ?? "http://localhost:9000";
  const bucket = getS3Bucket();
  return `${endpoint}/${bucket}/${key}`;
}
