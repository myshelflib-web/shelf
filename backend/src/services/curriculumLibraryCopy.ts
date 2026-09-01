import { scheduleIndexPage } from "./libraryIndex.js";
import { getFromS3, getObjectBuffer, uploadToS3 } from "./s3.js";
import { compressAndUploadToS3 } from "../utils/s3ObjectCompress.js";
import { errorFields, logger } from "../utils/logger.js";
import prisma from "../utils/prisma.js";
import { assertStorageRoom, QuotaError, type QuotaUser } from "../utils/quotas.js";
import type { CurriculumSaveMode } from "./curriculumSavePolicy.js";
import { downloadOfficialPdf } from "./ingest/officialPdfDownload.js";
import { curriculumSourceUrl } from "../utils/curriculumCopy.js";

type CurriculumArticle = {
  id: string;
  pdfKey: string | null;
  contentUrl: string | null;
  sourceUrl: string | null;
};

async function publishAsLinkSave(
  pageId: string,
  article: CurriculumArticle
): Promise<boolean> {
  const url = article.sourceUrl?.trim();
  if (!url) return false;

  const marker = curriculumSourceUrl(article.id);
  await prisma.userTopic.update({
    where: { id: pageId },
    data: {
      contentType: "LINK",
      sourceUrl: url,
      contentUrl: marker,
      pdfKey: null,
      fileSizeBytes: 0,
      status: "PUBLISHED",
    },
  });
  scheduleIndexPage(pageId);
  return true;
}

/** Copy curriculum files into the user's library page (runs after the API responds). */
export async function finishCurriculumLibraryCopy(params: {
  userId: string;
  pageId: string;
  article: CurriculumArticle;
  saveMode: CurriculumSaveMode;
  docPrefix: string;
  me: QuotaUser;
  log?: { error: (msg: string, fields?: Record<string, unknown>) => void };
}): Promise<void> {
  const { userId, pageId, article, saveMode, docPrefix, me, log } = params;
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
    } else if (saveMode === "download_remote" && article.sourceUrl) {
      const buffer = await downloadOfficialPdf(article.sourceUrl);
      storedBytes = buffer.length;
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

    if (article.contentUrl && saveMode === "copy_admin") {
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
    if (err instanceof QuotaError) {
      log?.error("curriculum.save_async_failed", errorFields(err));
      await prisma.userTopic
        .update({ where: { id: pageId }, data: { status: "FAILED" } })
        .catch(() => undefined);
      return;
    }

    const linked = await publishAsLinkSave(pageId, article).catch(() => false);
    if (linked) {
      logger.info("curriculum.save_link_fallback", {
        pageId,
        articleId: article.id,
        saveMode,
        err: err instanceof Error ? err.message : String(err),
      });
      return;
    }

    log?.error("curriculum.save_async_failed", errorFields(err));
    await prisma.userTopic
      .update({
        where: { id: pageId },
        data: { status: "FAILED" },
      })
      .catch(() => undefined);
  }
}
