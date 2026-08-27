import prisma from "../utils/prisma.js";
import { uploadToS3 } from "./s3.js";
import { losslessCompressBuffer } from "../utils/losslessCompress.js";
import { scheduleIndexPage } from "./libraryIndex.js";
import { userDocPrefix, sourcePdfKey, pageHref } from "../utils/docPaths.js";
import {
  uniquePageSlug,
  nextPageOrder,
  type PageSlugScope,
} from "../utils/pageScope.js";
import { userSelect } from "../utils/publicUser.js";
import {
  assertStorageRoom,
  QuotaError,
} from "../utils/quotas.js";
import { validateUploadBuffer } from "../utils/contentFiles.js";
import { getAppUrl } from "./email/config.js";

export class TelegramIngestError extends Error {
  userMessage: string;

  constructor(userMessage: string) {
    super(userMessage);
    this.userMessage = userMessage;
    this.name = "TelegramIngestError";
  }
}

async function chargeStorage(userId: string, extraBytes: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });
  if (!user) throw new QuotaError("User not found");
  assertStorageRoom(user, extraBytes);
  await prisma.user.update({
    where: { id: userId },
    data: { storageUsedBytes: { increment: BigInt(extraBytes) } },
  });
}

async function releaseStorage(userId: string, bytes: number) {
  if (bytes <= 0) return;
  await prisma.user.update({
    where: { id: userId },
    data: { storageUsedBytes: { decrement: BigInt(bytes) } },
  });
}

/**
 * Save a PDF buffer as a library-root page for the user (same path as direct upload).
 */
export async function ingestTelegramPdf(opts: {
  userId: string;
  title: string;
  buffer: Buffer;
}): Promise<{ pageId: string; title: string; href: string }> {
  const invalid = validateUploadBuffer("pdf", opts.buffer);
  if (invalid) {
    throw new TelegramIngestError("That file does not look like a valid PDF.");
  }

  const scope: PageSlugScope = { kind: "root", userId: opts.userId };
  const slug = await uniquePageSlug(scope, opts.title);
  const order = await nextPageOrder(scope);
  const docPrefix = userDocPrefix(opts.userId, null, null, slug);
  const pdfKey = sourcePdfKey(docPrefix);
  let charged = 0;

  try {
    const packed = await losslessCompressBuffer(
      opts.buffer,
      "application/pdf",
      `${opts.title}.pdf`
    );
    await chargeStorage(opts.userId, packed.length);
    charged = packed.length;
    await uploadToS3(pdfKey, packed, "application/pdf");

    const page = await prisma.userTopic.create({
      data: {
        userId: opts.userId,
        userSubjectId: null,
        userTopicGroupId: null,
        title: opts.title,
        slug,
        pdfKey,
        contentType: "PDF",
        fileSizeBytes: packed.length,
        status: "PUBLISHED",
        order,
      },
      select: { id: true, title: true, slug: true },
    });

    scheduleIndexPage(page.id);
    const href = `${getAppUrl()}${pageHref(null, null, page.slug)}`;
    return { pageId: page.id, title: page.title, href };
  } catch (err) {
    if (charged > 0) {
      await releaseStorage(opts.userId, charged).catch(() => undefined);
    }
    if (err instanceof QuotaError) {
      throw new TelegramIngestError(err.message);
    }
    throw err;
  }
}
