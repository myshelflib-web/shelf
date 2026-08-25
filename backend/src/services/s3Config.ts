import { S3Client } from "@aws-sdk/client-s3";

export function isR2Endpoint(endpoint?: string): boolean {
  return !!endpoint?.includes("r2.cloudflarestorage.com");
}

export function isLocalS3Endpoint(endpoint?: string): boolean {
  if (!endpoint) return false;
  return (
    endpoint.includes("localhost") ||
    endpoint.includes("127.0.0.1") ||
    endpoint.startsWith("http://")
  );
}

/** Host the browser uses for presigned PUT/GET. Defaults to S3_ENDPOINT. */
export function browserS3Endpoint(): string | undefined {
  return process.env.S3_PUBLIC_ENDPOINT || process.env.S3_ENDPOINT;
}

/** S3 client for MinIO (local) or Cloudflare R2 (production). */
export function createS3Client(endpoint = process.env.S3_ENDPOINT): S3Client {
  const r2 = isR2Endpoint(endpoint);

  return new S3Client({
    endpoint,
    // R2 requires "auto"; MinIO uses us-east-1 (or S3_REGION from env)
    region: r2 ? "auto" : (process.env.S3_REGION ?? "us-east-1"),
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
    // Path-style required for MinIO; also works reliably with R2
    forcePathStyle: r2 || isLocalS3Endpoint(endpoint),
    // Don't sign optional CRC32 headers — the browser never sends them on
    // presigned PUT/GET, which otherwise looks like a CORS/network failure.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}
