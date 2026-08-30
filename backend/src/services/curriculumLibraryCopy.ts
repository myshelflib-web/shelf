import { scheduleIndexPage } from "./libraryIndex.js";
import { getFromS3, getObjectBuffer, uploadToS3 } from "./s3.js";
import { compressAndUploadToS3 } from "../utils/s3ObjectCompress.js";
import { errorFields } from "../utils/logger.js";
import prisma from "../utils/prisma.js";
import { assertStorageRoom, QuotaError, type QuotaUser } from "../utils/quotas.js";

type CurriculumArticle = {
  id: string;
  pdfKey: string | null;
  contentUrl: string | null;
};

/** Copy curriculum files into the user's library page (runs after the API responds). */
export async function finishCurriculumLibraryCopy(params: {
  userId: string;
  pageId: string;
  article: CurriculumArticle;
  docPrefix: string;
  me: QuotaUser;
  log?: { error: (msg: string, fields?: Record<string, unknown>) => void };
}): Promise<void> {
  const { userId, pageId, article, docPrefix, me, log } = params;
  let storedBytes = 0;
  let pdfKey: string | null = null;
  let contentUrl: string | null = null;

  try {
    if (article.pdfKey) {
      const { buffer } = await getObjectBuffer(article.pdfKey);
      storedBytes += buffer.length;
      assertStorageRoom(me, storedBytes);
      pdfKey = `${docPrefix}/source.pdf`;
      const uploaded = await compressAndUploadToS3(
        pdfKey,
        buffer,
        "application/pdf"
      );
      storedBytes = uploaded.byteLength;
    } else {
      assertStorageRoom(me, 0);
    }
    if (article.contentUrl) {
      const html = await getFromS3(article.contentUrl);
      contentUrl = `${docPrefix}/content.html`;
      await uploadToS3(contentUrl, html, "text/html; charset=utf-8");
    }

    await prisma.userTopic.update({
      where: { id: pageId },
      data: {
        pdfKey,
        contentUrl,
        fileSizeBytes: storedBytes,
        status: "PUBLISHED",
      },
    });

    if (storedBytes > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { storageUsedBytes: { increment: storedBytes } },
      });
    }

    scheduleIndexPage(pageId);
  } catch (err) {
    log?.error("curriculum.save_async_failed", errorFields(err));
    await prisma.userTopic
      .update({
        where: { id: pageId },
        data: { status: "FAILED" },
      })
      .catch(() => undefined);
    if (err instanceof QuotaError) {
      return;
    }
  }
}
