import { putCachedPdf } from "@/lib/pdfByteCache";

/** Copy File/Blob bytes into IndexedDB so the first open is a cache hit. */
export async function seedPdfByteCache(
  pageId: string,
  version: string,
  source: Blob
): Promise<void> {
  if (!pageId || !version || source.size <= 0) return;
  try {
    const data = await source.arrayBuffer();
    await putCachedPdf(pageId, version, data);
  } catch {
    /* quota / private mode — ignore */
  }
}
