import type { Request, Response } from "express";
import { UserContentType } from "@prisma/client";
import prisma from "../utils/prisma.js";
import { getPresignedPutUrl } from "../services/s3.js";
import { errorFields } from "../utils/logger.js";
import { contentFlow, reqLog } from "../utils/flowLog.js";
import { userDocPrefix, sourcePdfKey } from "../utils/docPaths.js";
import {
  folderAncestors,
  folderSlugPathById,
} from "../utils/folderPath.js";
import {
  contentTypeForKind,
  signDirectUpload,
  type DirectUploadClaims,
} from "../utils/directUpload.js";
import type { DetectedFileKind } from "../utils/contentFiles.js";
import { pdfCacheVersion } from "./myContentPdfDirectUpload.js";

function kindFromContentType(ct: UserContentType): DetectedFileKind | null {
  switch (ct) {
    case "PDF":
      return "pdf";
    case "TEXT":
      return "text";
    case "MARKDOWN":
      return "markdown";
    case "DOCX":
      return "docx";
    default:
      return null;
  }
}

async function resolveParentSlugs(
  userId: string,
  folderId: string | null
): Promise<{ subjectSlug: string | null; groupSlug: string | null } | null> {
  if (!folderId) return { subjectSlug: null, groupSlug: null };
  const chain = await folderAncestors(folderId);
  if (chain.length === 0) return null;
  const root = await prisma.userFolder.findFirst({
    where: { id: chain[0].id, userId },
  });
  if (!root) return null;
  const slugs = await folderSlugPathById(folderId);
  return {
    subjectSlug: slugs[0] ?? null,
    groupSlug: slugs.length > 1 ? slugs[slugs.length - 1] ?? null : null,
  };
}

/**
 * Mint a fresh PUT URL + complete token for an existing DRAFT upload page
 * so the client can retry after CORS / network / token expiry without
 * creating a second draft.
 */
export async function resumeDraftUpload(
  req: Request,
  res: Response
): Promise<void> {
  const userId = req.user!.userId;
  const pageId = String(req.body?.pageId ?? "").trim();
  if (!pageId) {
    res.status(400).json({ error: "pageId is required" });
    return;
  }

  const clientPacked = Boolean(req.body?.clientPacked);

  try {
    const page = await prisma.userTopic.findFirst({
      where: { id: pageId, userId, status: "DRAFT" },
      select: {
        id: true,
        title: true,
        slug: true,
        contentType: true,
        pdfKey: true,
        fileSizeBytes: true,
        folderId: true,
        userSubjectId: true,
        userTopicGroupId: true,
      },
    });
    if (!page) {
      res.status(404).json({ error: "Upload draft not found" });
      return;
    }

    const kind = kindFromContentType(page.contentType);
    if (!kind) {
      res.status(400).json({ error: "Cannot resume this upload type" });
      return;
    }

    const slugs = await resolveParentSlugs(userId, page.folderId);
    if (!slugs) {
      res.status(404).json({ error: "Folder not found" });
      return;
    }

    const docPrefix = userDocPrefix(
      userId,
      slugs.subjectSlug,
      slugs.groupSlug,
      page.slug
    );
    const key =
      kind === "pdf"
        ? page.pdfKey || sourcePdfKey(docPrefix)
        : `${docPrefix}/upload.bin`;
    const putType = contentTypeForKind(kind);
    const size = page.fileSizeBytes > 0 ? page.fileSizeBytes : 1;

    const claims: Omit<DirectUploadClaims, "typ"> = {
      userId,
      key,
      title: page.title,
      slug: page.slug,
      kind,
      size,
      contentType: putType,
      clientPacked,
      pageId: page.id,
      folderId: page.folderId,
      userSubjectId: page.userSubjectId,
      userTopicGroupId: page.userTopicGroupId,
    };

    const token = signDirectUpload(claims);
    const uploadUrl = await getPresignedPutUrl(key, putType);

    contentFlow.uploadInit(reqLog(req), {
      kind,
      size,
      slug: page.slug,
      title: page.title,
      pageId: page.id,
      resume: true,
      folderId: page.folderId,
      userSubjectId: page.userSubjectId,
      userTopicGroupId: page.userTopicGroupId,
    });

    res.json({
      uploadUrl,
      headers: { "Content-Type": putType },
      token,
      page: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        status: "DRAFT",
        contentType: page.contentType,
      },
      ...(kind === "pdf"
        ? { pdfCacheVersion: pdfCacheVersion(key, size) }
        : {}),
    });
  } catch (err) {
    req.log?.error("my_content.upload_resume_failed", errorFields(err));
    res.status(500).json({ error: "Could not resume upload" });
  }
}
