import { Router, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../utils/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { param } from "../utils/param.js";
import { QuotaError, assertStorageRoom } from "../utils/quotas.js";
import { userSelect } from "../utils/publicUser.js";
import {
  deleteFromS3,
  getObjectPrefix,
  getPresignedPutUrl,
  headObjectMeta,
} from "../services/s3.js";
import { contentKeyFromPdfKey } from "../utils/docPaths.js";
import { scheduleIndexPage } from "../services/libraryIndex.js";
import { errorFields } from "../utils/logger.js";
import {
  normalizeDeletedPages,
  remapPageNumberAfterDeletes,
} from "../utils/pdfPageRemap.js";
import {
  signPdfReplace,
  verifyPdfReplace,
  type PdfReplaceMode,
} from "../utils/pdfReplaceToken.js";

const router = Router();
router.use(authMiddleware);

const MAX_RESTORE_HIGHLIGHTS = 400;

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

type HighlightSnap = {
  text?: unknown;
  startOffset?: unknown;
  endOffset?: unknown;
  color?: unknown;
  note?: unknown;
  kind?: unknown;
  pageNumber?: unknown;
  position?: unknown;
};

function parseRestoreHighlights(raw: unknown): HighlightSnap[] | null {
  if (!Array.isArray(raw)) return null;
  if (raw.length > MAX_RESTORE_HIGHLIGHTS) return null;
  return raw as HighlightSnap[];
}

/** Start replacing a library PDF (page delete or undo restore). */
router.post(
  "/pages/:id/pdf/replace/init",
  async (req: Request, res: Response) => {
    const pageId = param(req, "id");
    const size = Number(req.body?.size);
    const restore = Boolean(req.body?.restore);
    const mode: PdfReplaceMode = restore ? "restore" : "delete";
    const numPagesBefore = Number(req.body?.numPagesBefore);
    const deletedPages = restore
      ? []
      : normalizeDeletedPages(
          req.body?.deletedPages,
          Number.isFinite(numPagesBefore) ? numPagesBefore : 0
        );

    if (!Number.isFinite(size) || size <= 0) {
      res.status(400).json({ error: "Valid file size is required" });
      return;
    }
    if (!restore && !deletedPages) {
      res.status(400).json({
        error: "Select at least one page to delete (and keep at least one)",
      });
      return;
    }

    const page = await prisma.userTopic.findFirst({
      where: {
        id: pageId,
        userId: req.user!.userId,
        contentType: "PDF",
        pdfKey: { not: null },
      },
      select: {
        id: true,
        pdfKey: true,
        fileSizeBytes: true,
      },
    });
    if (!page?.pdfKey) {
      res.status(404).json({ error: "PDF page not found" });
      return;
    }

    const delta = size - (page.fileSizeBytes ?? 0);
    if (delta > 0) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: req.user!.userId },
          select: userSelect,
        });
        if (!user) {
          res.status(404).json({ error: "User not found" });
          return;
        }
        assertStorageRoom(user, delta);
      } catch (err) {
        if (err instanceof QuotaError) {
          res.status(err.status).json({ error: err.message });
          return;
        }
        throw err;
      }
    }

    const token = signPdfReplace({
      userId: req.user!.userId,
      pageId: page.id,
      key: page.pdfKey,
      size,
      mode,
      deletedPages: deletedPages ?? [],
    });

    try {
      const uploadUrl = await getPresignedPutUrl(page.pdfKey, "application/pdf");
      res.json({
        uploadUrl,
        headers: { "Content-Type": "application/pdf" },
        token,
      });
    } catch (err) {
      req.log?.error("my_content.pdf_replace_presign_failed", errorFields(err));
      res.status(500).json({ error: "Could not start PDF replace" });
    }
  }
);

router.post(
  "/pages/:id/pdf/replace/complete",
  async (req: Request, res: Response) => {
    const pageId = param(req, "id");
    const raw = String(req.body?.token ?? "");
    if (!raw) {
      res.status(400).json({ error: "Replace token required" });
      return;
    }

    let claims;
    try {
      claims = verifyPdfReplace(raw);
    } catch {
      res.status(400).json({ error: "Replace expired. Try again." });
      return;
    }

    if (claims.userId !== req.user!.userId || claims.pageId !== pageId) {
      res.status(403).json({ error: "Replace token does not match this page" });
      return;
    }

    const restoreHighlights =
      claims.mode === "restore"
        ? parseRestoreHighlights(req.body?.highlights)
        : null;
    if (claims.mode === "restore" && restoreHighlights == null) {
      res.status(400).json({ error: "Highlight snapshot required to undo" });
      return;
    }

    const page = await prisma.userTopic.findFirst({
      where: {
        id: pageId,
        userId: req.user!.userId,
        contentType: "PDF",
        pdfKey: claims.key,
      },
      select: {
        id: true,
        pdfKey: true,
        contentUrl: true,
        fileSizeBytes: true,
        viewPdfPage: true,
      },
    });
    if (!page?.pdfKey) {
      res.status(404).json({ error: "PDF page not found" });
      return;
    }

    let meta;
    try {
      meta = await headObjectMeta(claims.key);
    } catch {
      res.status(400).json({ error: "File did not reach storage. Try again." });
      return;
    }

    if (meta.contentLength <= 0 || meta.contentLength > claims.size + 1024) {
      res.status(400).json({ error: "Uploaded file does not match the request" });
      return;
    }

    try {
      const head = await getObjectPrefix(claims.key, 8);
      if (head.toString("latin1", 0, 4) !== "%PDF") {
        res.status(400).json({ error: "Uploaded file is not a valid PDF" });
        return;
      }
    } catch (err) {
      req.log?.error("my_content.pdf_replace_head_failed", errorFields(err));
      res.status(500).json({ error: "Could not verify PDF" });
      return;
    }

    const oldBytes = page.fileSizeBytes ?? 0;
    const newBytes = meta.contentLength;
    const delta = newBytes - oldBytes;

    try {
      if (delta > 0) await chargeStorage(claims.userId, delta);
      else if (delta < 0) await releaseStorage(claims.userId, -delta);
    } catch (err) {
      if (err instanceof QuotaError) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      throw err;
    }

    if (page.contentUrl && !/^https?:\/\//i.test(page.contentUrl)) {
      await deleteFromS3(page.contentUrl).catch(() => undefined);
    } else {
      await deleteFromS3(contentKeyFromPdfKey(page.pdfKey)).catch(() => undefined);
    }

    if (claims.mode === "restore" && restoreHighlights) {
      const viewPdfPage = Number(req.body?.viewPdfPage);
      await prisma.$transaction(async (tx) => {
        await tx.userContentHighlight.deleteMany({
          where: { userTopicId: page.id, userId: claims.userId },
        });
        if (restoreHighlights.length) {
          await tx.userContentHighlight.createMany({
            data: restoreHighlights.map((h) => ({
              userId: claims.userId,
              userTopicId: page.id,
              text: typeof h.text === "string" ? h.text : "",
              startOffset:
                typeof h.startOffset === "number" ? h.startOffset : 0,
              endOffset: typeof h.endOffset === "number" ? h.endOffset : 0,
              color: typeof h.color === "string" ? h.color : "yellow",
              note:
                typeof h.note === "string"
                  ? h.note.slice(0, 8000)
                  : h.note == null
                    ? null
                    : null,
              kind: h.kind === "REGION" ? "REGION" : "TEXT",
              pageNumber:
                typeof h.pageNumber === "number" ? h.pageNumber : null,
              position:
                h.position == null
                  ? Prisma.JsonNull
                  : (h.position as Prisma.InputJsonValue),
            })),
          });
        }
        await tx.userTopic.update({
          where: { id: page.id },
          data: {
            fileSizeBytes: newBytes,
            contentUrl: null,
            status: "PUBLISHED",
            viewPdfPage: Number.isInteger(viewPdfPage) && viewPdfPage >= 1
              ? viewPdfPage
              : page.viewPdfPage,
            viewPageOffset: 0,
          },
        });
      });
    } else {
      const deleted = new Set(claims.deletedPages);
      const highlights = await prisma.userContentHighlight.findMany({
        where: { userTopicId: page.id, pageNumber: { not: null } },
        select: { id: true, pageNumber: true },
      });

      const toDelete: string[] = [];
      const toUpdate: Array<{ id: string; pageNumber: number }> = [];
      for (const h of highlights) {
        const pn = h.pageNumber!;
        if (deleted.has(pn)) {
          toDelete.push(h.id);
          continue;
        }
        const next = remapPageNumberAfterDeletes(pn, claims.deletedPages);
        if (next != null && next !== pn) {
          toUpdate.push({ id: h.id, pageNumber: next });
        }
      }

      const nextView =
        page.viewPdfPage != null
          ? remapPageNumberAfterDeletes(page.viewPdfPage, claims.deletedPages) ??
            1
          : null;

      await prisma.$transaction(async (tx) => {
        if (toDelete.length) {
          await tx.userContentHighlight.deleteMany({
            where: { id: { in: toDelete }, userTopicId: page.id },
          });
        }
        for (const row of toUpdate) {
          await tx.userContentHighlight.update({
            where: { id: row.id },
            data: { pageNumber: row.pageNumber },
          });
        }
        await tx.userTopic.update({
          where: { id: page.id },
          data: {
            fileSizeBytes: newBytes,
            contentUrl: null,
            status: "PUBLISHED",
            viewPdfPage: nextView,
            viewPageOffset: nextView != null ? 0 : undefined,
          },
        });
      });
    }

    // Drop stale vectors by reindexing the replacement PDF (and OCR if needed).
    scheduleIndexPage(page.id);

    const updatedHighlights = await prisma.userContentHighlight.findMany({
      where: { userTopicId: page.id },
      orderBy: { createdAt: "asc" },
    });

    res.json({
      success: true,
      fileSizeBytes: newBytes,
      highlights: updatedHighlights,
    });
  }
);

export default router;
