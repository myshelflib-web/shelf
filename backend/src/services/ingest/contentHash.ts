import { createHash } from "crypto";

export function ingestContentHash(parts: {
  title: string;
  canonicalUrl: string;
  publishedAt?: Date | null;
  edition?: string | null;
}): string {
  const payload = [
    parts.title.trim().toLowerCase(),
    parts.canonicalUrl.trim().toLowerCase(),
    parts.publishedAt?.toISOString() ?? "",
    parts.edition?.trim() ?? "",
  ].join("|");
  return createHash("sha256").update(payload).digest("hex").slice(0, 32);
}

export function pdfContentHash(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex").slice(0, 32);
}
