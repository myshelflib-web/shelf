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

export function createS3Client(): S3Client {
  const endpoint = process.env.S3_ENDPOINT;
  const r2 = isR2Endpoint(endpoint);

  return new S3Client({
    endpoint,
    region: r2 ? "auto" : (process.env.S3_REGION ?? "us-east-1"),
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
    forcePathStyle: r2 || isLocalS3Endpoint(endpoint),
  });
}
