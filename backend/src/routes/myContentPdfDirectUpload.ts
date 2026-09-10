import type { Prisma } from "@prisma/client";
import prisma from "../utils/prisma.js";
import {
  deleteFromS3,
  getObjectPrefix,
  headObjectMeta,
} from "../services/s3.js";
import { validateUploadBuffer } from "../utils/contentFiles.js";
import { recompressS3ObjectUnlessClientPacked } from "../utils/s3ObjectCompress.js";
import type { DirectUploadClaims } from "../utils/directUpload.js";
import { scheduleIndexPage } from "../services/libraryIndex.js";

export const pdfUploadPageSelect = {
  id: true,
  title: true,
  slug: true,
  status: true,
  order: true,
  completed: true,
  starred: true,
  contentType: true,
} as const;

export type PdfUploadPageRow = Prisma.UserTopicGetPayload<{
  select: typeof pdfUploadPageSelect;
}>;

export function pdfCacheVersion(pdfKey: string, fileSizeBytes: number): string {
  return `${pdfKey}:${fileSizeBytes}`;
}

type ParentFields = {
  folderId: string | null;
  userSubjectId: null;
  userTopicGroupId: null;
};

/**
 * Create a DRAFT library row at init so the client can open while PUT +
 * complete finish. Processor ignores DRAFT. DRAFT rows are hidden from
 * library list APIs until published.
 */
export async function createDraftUploadPage(input: {
  userId: string;
  parentFields: ParentFields;
  title: string;
  slug: string;
  contentType: "PDF" | "TEXT" | "MARKDOWN" | "DOCX";
  /** PDF object key; omitted for text/md/docx until convert writes contentUrl. */
  pdfKey?: string;
  size: number;
  order: number;
}): Promise<PdfUploadPageRow> {
  return prisma.userTopic.create({
    data: {
      userId: input.userId,
      ...input.parentFields,
      title: input.title,
      slug: input.slug,
      ...(input.pdfKey ? { pdfKey: input.pdfKey } : {}),
      contentType: input.contentType,
      fileSizeBytes: input.size,
      status: "DRAFT",
      order: input.order,
    },
    select: pdfUploadPageSelect,
  });
}

/** @deprecated use createDraftUploadPage */
export async function createDraftPdfPage(input: {
  userId: string;
  parentFields: ParentFields;
  title: string;
  slug: string;
  pdfKey: string;
  size: number;
  order: number;
}): Promise<PdfUploadPageRow> {
  return createDraftUploadPage({
    ...input,
    contentType: "PDF",
  });
}

async function deleteDraftUpload(pageId: string, pdfKey: string): Promise<void> {
  await deleteFromS3(pdfKey).catch(() => undefined);
  await prisma.userTopic
    .deleteMany({ where: { id: pageId, status: "DRAFT" } })
    .catch(() => undefined);
}

export type FinalizePdfResult =
  | {
      ok: true;
      page: PdfUploadPageRow;
      pdfCacheVersion: string;
      bytes: number;
      created: boolean;
    }
  | { ok: false; status: number; error: string };

/**
 * Verify S3 object, optional recompress, charge (once), publish.
 * When `claims.pageId` is set, updates the draft from init; otherwise creates.
 * Publish uses a conditional DRAFT→PUBLISHED update so concurrent completes
 * cannot double-charge.
 */
export async function finalizePdfDirectUpload(input: {
  claims: DirectUploadClaims;
  parentFields: ParentFields;
  userId: string;
  chargeStorage: (userId: string, bytes: number) => Promise<void>;
  nextPageOrder: () => Promise<number>;
  resolveSlug: (preferred: string) => Promise<string>;
}): Promise<FinalizePdfResult> {
  const { claims } = input;

  const failAndCleanup = async (
    status: number,
    error: string
  ): Promise<FinalizePdfResult> => {
    if (claims.pageId) {
      await deleteDraftUpload(claims.pageId, claims.key);
    } else {
      await deleteFromS3(claims.key).catch(() => undefined);
    }
    return { ok: false, status, error };
  };

  let meta;
  try {
    meta = await headObjectMeta(claims.key);
  } catch {
    return failAndCleanup(400, "File did not reach storage. Try again.");
  }

  if (meta.contentLength <= 0 || meta.contentLength > claims.size + 1024) {
    return failAndCleanup(400, "Uploaded file does not match the request");
  }

  const head = await getObjectPrefix(claims.key, 8);
  const invalid = validateUploadBuffer("pdf", head);
  if (invalid) {
    return failAndCleanup(400, invalid);
  }

  const storedBytes = await recompressS3ObjectUnlessClientPacked(
    claims.key,
    "application/pdf",
    meta.contentLength,
    claims.clientPacked
  );

  if (claims.pageId) {
    const existing = await prisma.userTopic.findFirst({
      where: {
        id: claims.pageId,
        userId: input.userId,
        pdfKey: claims.key,
      },
      select: {
        ...pdfUploadPageSelect,
        fileSizeBytes: true,
        status: true,
      },
    });
    if (!existing) {
      await deleteFromS3(claims.key).catch(() => undefined);
      return { ok: false, status: 400, error: "Upload page not found" };
    }

    if (existing.status === "PUBLISHED") {
      return {
        ok: true,
        page: {
          id: existing.id,
          title: existing.title,
          slug: existing.slug,
          status: existing.status,
          order: existing.order,
          completed: existing.completed,
          starred: existing.starred,
          contentType: existing.contentType,
        },
        pdfCacheVersion: pdfCacheVersion(claims.key, existing.fileSizeBytes),
        bytes: existing.fileSizeBytes,
        created: false,
      };
    }

    // Claim DRAFT → PUBLISHED atomically (only one concurrent complete wins).
    const claimed = await prisma.userTopic.updateMany({
      where: {
        id: existing.id,
        userId: input.userId,
        status: "DRAFT",
        pdfKey: claims.key,
      },
      data: {
        status: "PUBLISHED",
        fileSizeBytes: storedBytes,
      },
    });

    if (claimed.count === 0) {
      const again = await prisma.userTopic.findFirst({
        where: { id: existing.id, userId: input.userId },
        select: { ...pdfUploadPageSelect, fileSizeBytes: true },
      });
      if (again?.status === "PUBLISHED") {
        return {
          ok: true,
          page: again,
          pdfCacheVersion: pdfCacheVersion(claims.key, again.fileSizeBytes),
          bytes: again.fileSizeBytes,
          created: false,
        };
      }
      return { ok: false, status: 400, error: "Upload page not found" };
    }

    try {
      await input.chargeStorage(input.userId, storedBytes);
    } catch (err) {
      await prisma.userTopic
        .updateMany({
          where: { id: existing.id, status: "PUBLISHED" },
          data: { status: "FAILED" },
        })
        .catch(() => undefined);
      throw err;
    }

    const page = await prisma.userTopic.findFirstOrThrow({
      where: { id: existing.id },
      select: pdfUploadPageSelect,
    });
    scheduleIndexPage(page.id);
    return {
      ok: true,
      page,
      pdfCacheVersion: pdfCacheVersion(claims.key, storedBytes),
      bytes: storedBytes,
      created: false,
    };
  }

  const slug = await input.resolveSlug(claims.slug);
  const order = await input.nextPageOrder();
  await input.chargeStorage(input.userId, storedBytes);
  const page = await prisma.userTopic.create({
    data: {
      userId: input.userId,
      ...input.parentFields,
      title: claims.title,
      slug,
      pdfKey: claims.key,
      contentType: "PDF",
      fileSizeBytes: storedBytes,
      status: "PUBLISHED",
      order,
    },
    select: pdfUploadPageSelect,
  });
  scheduleIndexPage(page.id);
  return {
    ok: true,
    page,
    pdfCacheVersion: pdfCacheVersion(claims.key, storedBytes),
    bytes: storedBytes,
    created: true,
  };
}
