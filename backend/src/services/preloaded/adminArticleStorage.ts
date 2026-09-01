import { deleteFromS3 } from "../s3.js";
import { contentKeyFromPdfKey } from "../../utils/docPaths.js";

/** Remove mirrored admin article bytes from S3 (PDF + derived HTML). */
export async function deleteAdminArticleStorage(opts: {
  pdfKey: string | null;
  contentUrl?: string | null;
}): Promise<void> {
  if (opts.pdfKey) {
    await deleteFromS3(opts.pdfKey).catch(() => undefined);
    await deleteFromS3(contentKeyFromPdfKey(opts.pdfKey)).catch(() => undefined);
  }
  if (opts.contentUrl && opts.contentUrl !== opts.pdfKey) {
    await deleteFromS3(opts.contentUrl).catch(() => undefined);
    if (opts.contentUrl.endsWith("/content.html")) {
      await deleteFromS3(
        opts.contentUrl.replace(/content\.html$/, "content.txt")
      ).catch(() => undefined);
    }
  }
}
