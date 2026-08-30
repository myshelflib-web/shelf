import { Router, Request, Response } from "express";
import multer from "multer";
import { UserContentType } from "@prisma/client";
import prisma from "../utils/prisma.js";
import { uploadToS3, getFromS3, deleteFromS3, headObjectMeta, getObjectStream, getPresignedPutUrl, getPresignedPdfGetUrl, PDF_PRESIGN_EXPIRES_SEC, getObjectPrefix, getObjectBuffer } from "../services/s3.js";
import { losslessCompressBuffer } from "../utils/losslessCompress.js";
import { recompressS3ObjectIfSmaller } from "../utils/s3ObjectCompress.js";
import { authMiddleware } from "../middleware/auth.js";
import { param } from "../utils/param.js";
import { QuotaError, assertStorageRoom } from "../utils/quotas.js";
import { userSelect } from "../utils/publicUser.js";
import { scheduleDeletePageVectors, scheduleIndexPage } from "../services/libraryIndex.js";
import {
  userDocPrefix,
  sourcePdfKey,
  contentHtmlKey,
  contentKeyFromPdfKey,
  pageHref,
} from "../utils/docPaths.js";
import {
  slugify,
  isReservedSlug,
  uniquePageSlug,
  findPageBySlug,
  nextPageOrder,
  pageOrderWhere,
  type PageSlugScope,
} from "../utils/pageScope.js";
import {
  browseNotebooks,
  NOTEBOOK_PAGE_SIZE,
  parseNotebookFilter,
  parseNotebookSort,
  type SlimNotebook,
} from "../utils/notebookBrowse.js";
import { mergeReorder } from "../utils/libraryReorder.js";
import {
  loadBulkDeletePages,
  loadBulkDeleteSubjects,
  loadBulkDeleteTopicGroups,
  normalizeBulkDeleteInput,
  pageCoveredByBulkDelete,
} from "../utils/libraryBulkDelete.js";
import { parsePublicHttpUrl } from "../utils/publicUrl.js";
import { parseBytesRange } from "../utils/byteRange.js";
import { errorFields } from "../utils/logger.js";
import {
  hasParsedPageView,
  parsePageView,
} from "../utils/pageView.js";
import {
  canAnnotate,
  findAccessiblePage,
} from "../utils/pageAccess.js";
import {
  DOCUMENT_MAX_BYTES,
  detectFileKind,
  bufferToHtml,
  validateUploadBuffer,
  sanitizeStoredHtml,
  ALLOWED_UPLOAD_HINT,
  escapeHtml,
} from "../utils/contentFiles.js";
import {
  ImportLinkError,
  fetchRemoteDocument,
  checkUrlEmbeddable,
} from "../services/importLink.js";
import {
  contentTypeForKind,
  maxBytesForKind,
  signDirectUpload,
  verifyDirectUpload,
} from "../utils/directUpload.js";
import { parseYoutubeUrl } from "../utils/youtubeUrl.js";
import { createVideoPage } from "../services/youtubeImport.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: DOCUMENT_MAX_BYTES },
});

const pageSelect = {
  id: true,
  title: true,
  slug: true,
  status: true,
  order: true,
  completed: true,
  starred: true,
  contentType: true,
} as const;

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

async function fetchContent(contentUrl: string | null): Promise<string | null> {
  if (!contentUrl || /^https?:\/\//i.test(contentUrl)) return null;
  try {
    return await getFromS3(contentUrl);
  } catch {
    return null;
  }
}

async function deletePageAssets(userId: string, page: {
  pdfKey: string | null;
  contentUrl: string | null;
  fileSizeBytes: number | null;
}) {
  if (page.pdfKey) await deleteFromS3(page.pdfKey).catch(() => {});
  if (page.contentUrl && !/^https?:\/\//i.test(page.contentUrl)) {
    await deleteFromS3(page.contentUrl).catch(() => {});
  } else if (page.pdfKey) {
    await deleteFromS3(contentKeyFromPdfKey(page.pdfKey)).catch(() => {});
  }
  await releaseStorage(userId, page.fileSizeBytes ?? 0);
}

function contentTypeFromKind(kind: string): UserContentType {
  const map: Record<string, UserContentType> = {
    pdf: "PDF",
    html: "HTML",
    markdown: "MARKDOWN",
    text: "TEXT",
    docx: "DOCX",
  };
  return map[kind] ?? "HTML";
}

const notebookTreeInclude = {
  topicGroups: {
    orderBy: { order: "asc" as const },
    include: {
      pages: { orderBy: { order: "asc" as const }, select: pageSelect },
    },
  },
  topics: {
    where: { userTopicGroupId: null },
    orderBy: { order: "asc" as const },
    select: pageSelect,
  },
};

function shapeSubject<T extends { topics?: unknown }>(subject: T) {
  const { topics, ...rest } = subject;
  return { ...rest, pages: topics ?? [] };
}

async function notebooksByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const subjects = await prisma.userSubject.findMany({
    where: { id: { in: ids } },
    include: notebookTreeInclude,
  });
  const map = new Map(subjects.map((s) => [s.id, s]));
  const ordered: typeof subjects = [];
  for (const id of ids) {
    const s = map.get(id);
    if (s) ordered.push(s);
  }
  return ordered.map(shapeSubject);
}

type PageParent = {
  userId: string;
  scope: PageSlugScope;
  userSubjectId: string | null;
  userTopicGroupId: string | null;
  subjectSlug: string | null;
  groupSlug: string | null;
};

function rootPageParent(userId: string): PageParent {
  return {
    userId,
    scope: { kind: "root", userId },
    userSubjectId: null,
    userTopicGroupId: null,
    subjectSlug: null,
    groupSlug: null,
  };
}

async function notebookPageParent(
  userId: string,
  subjectId: string
): Promise<PageParent | null> {
  const subject = await prisma.userSubject.findFirst({
    where: { id: subjectId, userId },
  });
  if (!subject) return null;
  return {
    userId,
    scope: { kind: "notebook", userSubjectId: subject.id },
    userSubjectId: subject.id,
    userTopicGroupId: null,
    subjectSlug: subject.slug,
    groupSlug: null,
  };
}

async function topicPageParent(
  userId: string,
  subjectId: string,
  groupId: string
): Promise<PageParent | null> {
  const subject = await prisma.userSubject.findFirst({
    where: { id: subjectId, userId },
  });
  const group = await prisma.userTopicGroup.findFirst({
    where: { id: groupId, userSubjectId: subject?.id },
  });
  if (!subject || !group) return null;
  return {
    userId,
    scope: { kind: "topic", userTopicGroupId: group.id },
    userSubjectId: subject.id,
    userTopicGroupId: group.id,
    subjectSlug: subject.slug,
    groupSlug: group.slug,
  };
}

async function handlePageUpload(
  req: Request,
  res: Response,
  parent: PageParent
) {
  const { title, slug: rawSlug } = req.body;
  const file = req.file;

  if (!title?.trim() || !file) {
    res.status(400).json({ error: "Title and file required" });
    return;
  }

  const kind = detectFileKind(file.originalname, file.mimetype);
  if (!kind) {
    res.status(400).json({ error: ALLOWED_UPLOAD_HINT });
    return;
  }

  const invalid = validateUploadBuffer(kind, file.buffer);
  if (invalid) {
    res.status(400).json({ error: invalid });
    return;
  }

  const slug = rawSlug
    ? slugify(rawSlug)
    : await uniquePageSlug(parent.scope, title);
  if (rawSlug) {
    const existing = await findPageBySlug(parent.scope, slug);
    if (existing) {
      res.status(409).json({
        error: "A page with this name already exists",
      });
      return;
    }
  }

  const docPrefix = userDocPrefix(
    parent.userId,
    parent.subjectSlug,
    parent.groupSlug,
    slug
  );
  const order = await nextPageOrder(parent.scope);
  let chargedBytes = 0;

  try {
    if (kind === "pdf") {
      const packed = await losslessCompressBuffer(
        file.buffer,
        "application/pdf",
        file.originalname
      );
      await chargeStorage(parent.userId, packed.length);
      chargedBytes = packed.length;
      const pdfKey = sourcePdfKey(docPrefix);
      await uploadToS3(pdfKey, packed, "application/pdf");
      const page = await prisma.userTopic.create({
        data: {
          userId: parent.userId,
          userSubjectId: parent.userSubjectId,
          userTopicGroupId: parent.userTopicGroupId,
          title: title.trim(),
          slug,
          pdfKey,
          contentType: "PDF",
          fileSizeBytes: packed.length,
          status: "PUBLISHED",
          order,
        },
        select: pageSelect,
      });
      scheduleIndexPage(page.id);
      res.status(201).json({
        page,
        message: "PDF uploaded. Open the page to read it.",
      });
      return;
    }

    const packed = await losslessCompressBuffer(
      file.buffer,
      contentTypeForKind(kind),
      file.originalname
    );
    const html = await bufferToHtml(packed, kind, title.trim());
    const htmlBytes = Buffer.byteLength(html, "utf8");
    await chargeStorage(parent.userId, htmlBytes);
    chargedBytes = htmlBytes;
    const contentKey = contentHtmlKey(docPrefix);
    await uploadToS3(contentKey, html, "text/html");

    const page = await prisma.userTopic.create({
      data: {
        userId: parent.userId,
        userSubjectId: parent.userSubjectId,
        userTopicGroupId: parent.userTopicGroupId,
        title: title.trim(),
        slug,
        contentUrl: contentKey,
        contentType: contentTypeFromKind(kind),
        fileSizeBytes: htmlBytes,
        status: "PUBLISHED",
        order,
      },
      select: pageSelect,
    });

    scheduleIndexPage(page.id);
    res.status(201).json({ page, message: "File converted and ready to read." });
  } catch (err) {
    if (chargedBytes > 0) {
      await releaseStorage(parent.userId, chargedBytes).catch(() => undefined);
    }
    if (err instanceof QuotaError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
}

async function handlePageCreate(
  req: Request,
  res: Response,
  parent: PageParent
) {
  const { title, htmlContent, sourceUrl: rawSourceUrl } = req.body;

  if (!title?.trim()) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const sourceUrl = rawSourceUrl
    ? parsePublicHttpUrl(String(rawSourceUrl))
    : null;
  if (rawSourceUrl && !sourceUrl) {
    res.status(400).json({
      error: "Enter a public http(s) link to a website or PDF.",
    });
    return;
  }

  const slug = await uniquePageSlug(parent.scope, title);
  const order = await nextPageOrder(parent.scope);

  if (sourceUrl) {
    const youtube = parseYoutubeUrl(sourceUrl);
    if (youtube?.kind === "playlist") {
      res.status(400).json({
        error: "Paste playlists under Add page → YouTube to import every lecture.",
      });
      return;
    }
    if (youtube?.kind === "video") {
      try {
        const page = await createVideoPage({
          parent,
          title: title.trim(),
          videoId: youtube.videoId,
          playlistId: youtube.playlistId,
        });
        res.status(201).json({ page });
      } catch (err) {
        if (err instanceof QuotaError) {
          res.status(err.status).json({ error: err.message });
          return;
        }
        throw err;
      }
      return;
    }

    const page = await prisma.userTopic.create({
      data: {
        userId: parent.userId,
        userSubjectId: parent.userSubjectId,
        userTopicGroupId: parent.userTopicGroupId,
        title: title.trim(),
        slug,
        sourceUrl,
        contentType: "LINK",
        fileSizeBytes: 0,
        status: "PUBLISHED",
        order,
      },
      select: pageSelect,
    });
    scheduleIndexPage(page.id);
    res.status(201).json({ page });
    return;
  }

  const contentKey = contentHtmlKey(
    userDocPrefix(
      parent.userId,
      parent.subjectSlug,
      parent.groupSlug,
      slug
    )
  );
  const html = sanitizeStoredHtml(
    htmlContent?.trim() ||
      `<h2 id="section-1">${escapeHtml(title.trim())}</h2><p>Start writing your notes here.</p>`
  );
  const htmlBytes = Buffer.byteLength(html, "utf8");

  try {
    await chargeStorage(parent.userId, htmlBytes);
  } catch (err) {
    if (err instanceof QuotaError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }

  await uploadToS3(contentKey, html, "text/html");

  const page = await prisma.userTopic.create({
    data: {
      userId: parent.userId,
      userSubjectId: parent.userSubjectId,
      userTopicGroupId: parent.userTopicGroupId,
      title: title.trim(),
      slug,
      contentUrl: contentKey,
      contentType: "HTML",
      fileSizeBytes: htmlBytes,
      status: "PUBLISHED",
      order,
    },
    select: pageSelect,
  });

  scheduleIndexPage(page.id);
  res.status(201).json({ page });
}

const pageLoadInclude = {
  userSubject: { select: { name: true, slug: true, icon: true } },
  userTopicGroup: { select: { title: true, slug: true } },
} as const;

async function loadPageInScope(
  userId: string,
  scope: PageSlugScope,
  pageSlug: string,
  notebookSlug: string | null,
  topicSlug: string | null
) {
  const found = await findPageBySlug(scope, pageSlug);
  if (!found || found.userId !== userId) return null;

  const page = await prisma.userTopic.findUnique({
    where: { id: found.id },
    include: pageLoadInclude,
  });
  if (!page) return null;

  const allPages = await prisma.userTopic.findMany({
    where: pageOrderWhere(scope),
    orderBy: { order: "asc" },
    select: { slug: true, title: true },
  });

  return { page, allPages, notebookSlug, topicSlug };
}

async function loadPageBySlugs(
  userId: string,
  notebookSlug: string,
  topicSlug: string,
  pageSlug: string
) {
  const subject = await prisma.userSubject.findUnique({
    where: { userId_slug: { userId, slug: notebookSlug } },
  });
  if (!subject) return null;

  const group = await prisma.userTopicGroup.findFirst({
    where: { userSubjectId: subject.id, slug: topicSlug },
  });
  if (!group) return null;

  return loadPageInScope(
    userId,
    { kind: "topic", userTopicGroupId: group.id },
    pageSlug,
    subject.slug,
    group.slug
  );
}

async function sendPageLoadResponse(
  res: Response,
  loaded: NonNullable<Awaited<ReturnType<typeof loadPageInScope>>>
) {
  const { page, allPages, notebookSlug, topicSlug } = loaded;
  const idx = allPages.findIndex((p) => p.slug === page.slug);
  const isPdf = page.contentType === "PDF";
  const isLink = page.contentType === "LINK";
  const content = isPdf || isLink ? null : await fetchContent(page.contentUrl);
  const hasView =
    page.viewedAt != null ||
    page.viewPdfPage != null ||
    page.viewScrollTop != null;

  res.json({
    page: {
      id: page.id,
      title: page.title,
      slug: page.slug,
      content,
      status: page.status,
      contentType: page.contentType,
      sourceUrl: page.sourceUrl ?? null,
      hasPdf: Boolean(page.pdfKey),
      completed: page.completed,
      readPercent: page.readPercent,
      starred: page.starred,
      notebook: page.userSubject,
      topic: page.userTopicGroup,
      isPersonal: true,
      view: hasView
        ? {
            pdfPage: page.viewPdfPage,
            pageOffset: page.viewPageOffset,
            scrollTop: page.viewScrollTop,
            scale: page.viewScale,
            viewedAt: page.viewedAt?.toISOString() ?? null,
          }
        : null,
    },
    navigation: {
      prev: idx > 0 ? allPages[idx - 1] : null,
      next: idx < allPages.length - 1 ? allPages[idx + 1] : null,
    },
    context: { notebookSlug, topicSlug },
  });
}

router.use(authMiddleware);

router.post("/uploads/init", async (req: Request, res: Response) => {
  const title = String(req.body?.title ?? "").trim();
  const filename = String(req.body?.filename ?? "");
  const size = Number(req.body?.size);
  const contentType = String(req.body?.contentType ?? "");
  const subjectId = req.body?.subjectId ? String(req.body.subjectId) : undefined;
  const topicGroupId = req.body?.topicGroupId
    ? String(req.body.topicGroupId)
    : undefined;

  if (!title || !filename || !Number.isFinite(size) || size <= 0) {
    res.status(400).json({ error: "Title, filename, and size are required" });
    return;
  }

  const kind = detectFileKind(filename, contentType);
  if (!kind) {
    res.status(400).json({ error: ALLOWED_UPLOAD_HINT });
    return;
  }

  const maxBytes = maxBytesForKind(kind);
  if (maxBytes != null && size > maxBytes) {
    res.status(400).json({ error: "File is too large" });
    return;
  }

  let parent: PageParent;
  try {
    if (subjectId && topicGroupId) {
      const next = await topicPageParent(req.user!.userId, subjectId, topicGroupId);
      if (!next) {
        res.status(404).json({ error: "Collection or topic not found" });
        return;
      }
      parent = next;
    } else if (subjectId) {
      const next = await notebookPageParent(req.user!.userId, subjectId);
      if (!next) {
        res.status(404).json({ error: "Collection not found" });
        return;
      }
      parent = next;
    } else {
      parent = rootPageParent(req.user!.userId);
    }
  } catch (err) {
    req.log?.error("my_content.upload_init_parent_failed", errorFields(err));
    res.status(500).json({ error: "Could not start upload" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parent.userId },
      select: userSelect,
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    assertStorageRoom(user, size);
  } catch (err) {
    if (err instanceof QuotaError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }

  const slug = await uniquePageSlug(parent.scope, title);
  const docPrefix = userDocPrefix(
    parent.userId,
    parent.subjectSlug,
    parent.groupSlug,
    slug
  );
  const putType = contentTypeForKind(kind);
  const key =
    kind === "pdf" ? sourcePdfKey(docPrefix) : `${docPrefix}/upload.bin`;

  const token = signDirectUpload({
    userId: parent.userId,
    key,
    title,
    slug,
    kind,
    size,
    contentType: putType,
    userSubjectId: parent.userSubjectId,
    userTopicGroupId: parent.userTopicGroupId,
  });

  try {
    const uploadUrl = await getPresignedPutUrl(key, putType);
    res.json({
      uploadUrl,
      headers: { "Content-Type": putType },
      token,
    });
  } catch (err) {
    req.log?.error("my_content.upload_presign_failed", errorFields(err));
    res.status(500).json({ error: "Could not start upload" });
  }
});

router.post("/uploads/complete", async (req: Request, res: Response) => {
  const raw = String(req.body?.token ?? "");
  if (!raw) {
    res.status(400).json({ error: "Upload token required" });
    return;
  }

  let claims;
  try {
    claims = verifyDirectUpload(raw);
  } catch {
    res.status(400).json({ error: "Upload expired. Try again." });
    return;
  }

  if (claims.userId !== req.user!.userId) {
    res.status(403).json({ error: "Upload token does not match this account" });
    return;
  }

  const parent: PageParent = {
    userId: claims.userId,
    userSubjectId: claims.userSubjectId,
    userTopicGroupId: claims.userTopicGroupId,
    subjectSlug: null,
    groupSlug: null,
    scope: claims.userTopicGroupId
      ? { kind: "topic", userTopicGroupId: claims.userTopicGroupId }
      : claims.userSubjectId
        ? { kind: "notebook", userSubjectId: claims.userSubjectId }
        : { kind: "root", userId: claims.userId },
  };

  if (parent.userSubjectId) {
    const subject = await prisma.userSubject.findFirst({
      where: { id: parent.userSubjectId, userId: parent.userId },
      select: { slug: true },
    });
    if (!subject) {
      res.status(404).json({ error: "Collection not found" });
      return;
    }
    parent.subjectSlug = subject.slug;
    if (parent.userTopicGroupId) {
      const group = await prisma.userTopicGroup.findFirst({
        where: {
          id: parent.userTopicGroupId,
          userSubjectId: parent.userSubjectId,
        },
        select: { slug: true },
      });
      if (!group) {
        res.status(404).json({ error: "Topic not found" });
        return;
      }
      parent.groupSlug = group.slug;
    }
  }

  let meta;
  try {
    meta = await headObjectMeta(claims.key);
  } catch {
    res.status(400).json({ error: "File did not reach storage. Try again." });
    return;
  }

  if (meta.contentLength <= 0 || meta.contentLength > claims.size + 1024) {
    await deleteFromS3(claims.key).catch(() => undefined);
    res.status(400).json({ error: "Uploaded file does not match the request" });
    return;
  }

  const slug = (await findPageBySlug(parent.scope, claims.slug))
    ? await uniquePageSlug(parent.scope, claims.title)
    : claims.slug;
  const order = await nextPageOrder(parent.scope);
  let chargedBytes = 0;

  try {
    if (claims.kind === "pdf") {
      const head = await getObjectPrefix(claims.key, 8);
      const invalid = validateUploadBuffer("pdf", head);
      if (invalid) {
        await deleteFromS3(claims.key).catch(() => undefined);
        res.status(400).json({ error: invalid });
        return;
      }
      const storedBytes = await recompressS3ObjectIfSmaller(
        claims.key,
        "application/pdf",
        meta.contentLength
      );
      await chargeStorage(parent.userId, storedBytes);
      chargedBytes = storedBytes;
      const page = await prisma.userTopic.create({
        data: {
          userId: parent.userId,
          userSubjectId: parent.userSubjectId,
          userTopicGroupId: parent.userTopicGroupId,
          title: claims.title,
          slug,
          pdfKey: claims.key,
          contentType: "PDF",
          fileSizeBytes: storedBytes,
          status: "PUBLISHED",
          order,
        },
        select: pageSelect,
      });
      scheduleIndexPage(page.id);
      res.status(201).json({
        page,
        message: "PDF uploaded. Open the page to read it.",
      });
      return;
    }

    const { buffer } = await getObjectBuffer(claims.key);
    const packed = await losslessCompressBuffer(
      buffer,
      claims.contentType,
      claims.title
    );
    const invalid = validateUploadBuffer(claims.kind, packed);
    if (invalid) {
      await deleteFromS3(claims.key).catch(() => undefined);
      res.status(400).json({ error: invalid });
      return;
    }
    const html = await bufferToHtml(packed, claims.kind, claims.title);
    const htmlBytes = Buffer.byteLength(html, "utf8");
    await chargeStorage(parent.userId, htmlBytes);
    chargedBytes = htmlBytes;
    const contentKey = contentHtmlKey(
      userDocPrefix(
        parent.userId,
        parent.subjectSlug,
        parent.groupSlug,
        slug
      )
    );
    await uploadToS3(contentKey, html, "text/html");
    await deleteFromS3(claims.key).catch(() => undefined);
    const page = await prisma.userTopic.create({
      data: {
        userId: parent.userId,
        userSubjectId: parent.userSubjectId,
        userTopicGroupId: parent.userTopicGroupId,
        title: claims.title,
        slug,
        contentUrl: contentKey,
        contentType: contentTypeFromKind(claims.kind),
        fileSizeBytes: htmlBytes,
        status: "PUBLISHED",
        order,
      },
      select: pageSelect,
    });
    scheduleIndexPage(page.id);
    res.status(201).json({ page, message: "File converted and ready to read." });
  } catch (err) {
    if (chargedBytes > 0) {
      await releaseStorage(parent.userId, chargedBytes).catch(() => undefined);
    }
    if (err instanceof QuotaError) {
      await deleteFromS3(claims.key).catch(() => undefined);
      res.status(err.status).json({ error: err.message });
      return;
    }
    req.log?.error("my_content.upload_complete_failed", errorFields(err));
    res.status(500).json({ error: "Could not finish upload" });
  }
});

const LAST_READ_ROOT_KEY = "__root__";

type LastReadDto = {
  href: string;
  title: string;
  notebookSlug: string | null;
  topicSlug: string | null;
  viewedAt: number;
};

function lastReadStorageKey(
  notebookSlug: string | null,
  topicSlug: string | null
): string {
  if (!notebookSlug) return LAST_READ_ROOT_KEY;
  if (topicSlug) return `${notebookSlug}/${topicSlug}`;
  return notebookSlug;
}

router.get("/last-read", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const pages = await prisma.userTopic.findMany({
      where: { userId, viewedAt: { not: null } },
      orderBy: { viewedAt: "desc" },
      take: 80,
      select: {
        title: true,
        slug: true,
        viewedAt: true,
        userSubject: { select: { slug: true } },
        userTopicGroup: { select: { slug: true } },
      },
    });

    const notebooks: Record<string, LastReadDto> = {};
    let last: LastReadDto | null = null;
    for (const page of pages) {
      if (!page.viewedAt) continue;
      const notebookSlug = page.userSubject?.slug ?? null;
      const topicSlug = page.userTopicGroup?.slug ?? null;
      const entry: LastReadDto = {
        href: pageHref(notebookSlug, topicSlug, page.slug),
        title: page.title,
        notebookSlug,
        topicSlug,
        viewedAt: page.viewedAt.getTime(),
      };
      if (!last) last = entry;
      const notebookKey = lastReadStorageKey(notebookSlug, null);
      if (!notebooks[notebookKey]) notebooks[notebookKey] = entry;
      if (topicSlug) {
        const topicKey = lastReadStorageKey(notebookSlug, topicSlug);
        if (!notebooks[topicKey]) notebooks[topicKey] = entry;
      }
    }

    res.json({ last, notebooks });
  } catch (err) {
    req.log?.error("my_content.last_read_failed", errorFields(err));
    res.status(500).json({ error: "Could not load last read" });
  }
});

router.get("/subjects", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const q = String(req.query.q ?? "").slice(0, 120);
    const sort = parseNotebookSort(req.query.sort);
    const filter = parseNotebookFilter(req.query.filter);
    const pageSize = Math.min(
      NOTEBOOK_PAGE_SIZE,
      Math.max(1, Number(req.query.pageSize) || NOTEBOOK_PAGE_SIZE)
    );
    const requestedPage = Math.max(1, Number(req.query.page) || 1);

    const rows = await prisma.userSubject.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        description: true,
        order: true,
        createdAt: true,
        updatedAt: true,
        topics: {
          select: { title: true, contentType: true, starred: true },
        },
      },
    });

    const slim: SlimNotebook[] = rows.map((row) => {
      const pages = row.topics;
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        order: row.order,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        pageCount: pages.length,
        hasPdf: pages.some((p) => p.contentType === "PDF"),
        hasLink: pages.some((p) => p.contentType === "LINK"),
        hasStarred: pages.some((p) => p.starred),
        pageTitles: pages.map((p) => p.title),
      };
    });

    const { ids, total, page, totalPages } = browseNotebooks(slim, {
      q,
      sort,
      filter,
      page: requestedPage,
      pageSize,
    });
    const subjects = await notebooksByIds(ids);
    const rootPages = await prisma.userTopic.findMany({
      where: {
        userId,
        userSubjectId: null,
        userTopicGroupId: null,
      },
      orderBy: { order: "asc" },
      select: pageSelect,
    });

    res.json({
      subjects,
      rootPages,
      page,
      pageSize,
      total,
      totalPages,
    });
  } catch (err) {
    req.log?.error("my_content.list_subjects_failed", errorFields(err));
    res.status(500).json({ error: "Could not load collections" });
  }
});

router.get("/subjects/slug/:slug", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const subject = await prisma.userSubject.findFirst({
      where: { userId, slug: param(req, "slug") },
      include: notebookTreeInclude,
    });
    if (!subject) {
      res.status(404).json({ error: "Collection not found" });
      return;
    }
    res.json({ subject: shapeSubject(subject) });
  } catch (err) {
    req.log?.error("my_content.get_subject_failed", errorFields(err));
    res.status(500).json({ error: "Could not load collection" });
  }
});

router.post("/subjects", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { name, description, icon } = req.body;

  if (!name?.trim()) {
    res.status(400).json({ error: "Name is required" });
    return;
  }

  const slug = slugify(name);
  if (isReservedSlug(slug)) {
    res.status(400).json({ error: "That collection name is reserved" });
    return;
  }
  const existing = await prisma.userSubject.findUnique({
    where: { userId_slug: { userId, slug } },
  });
  if (existing) {
    res.status(409).json({ error: "A collection with this name already exists" });
    return;
  }

  const count = await prisma.userSubject.count({ where: { userId } });
  const subject = await prisma.userSubject.create({
    data: {
      userId,
      name: name.trim(),
      slug,
      description,
      icon: icon ?? "📁",
      order: count + 1,
    },
    include: notebookTreeInclude,
  });

  res.status(201).json({ subject: shapeSubject(subject) });
});

router.post("/subjects/:subjectId/topic-groups", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { title } = req.body as { title?: string };

  if (!title?.trim()) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const subject = await prisma.userSubject.findFirst({
    where: { id: param(req, "subjectId"), userId },
  });
  if (!subject) {
    res.status(404).json({ error: "Collection not found" });
    return;
  }

  const slug = slugify(title);
  if (isReservedSlug(slug)) {
    res.status(400).json({ error: "That topic name is reserved" });
    return;
  }
  const existing = await prisma.userTopicGroup.findUnique({
    where: { userSubjectId_slug: { userSubjectId: subject.id, slug } },
  });
  if (existing) {
    res.status(409).json({ error: "A topic with this name already exists" });
    return;
  }

  const order =
    (await prisma.userTopicGroup.count({ where: { userSubjectId: subject.id } })) + 1;
  const group = await prisma.userTopicGroup.create({
    data: {
      userSubjectId: subject.id,
      title: title.trim(),
      slug,
      order,
    },
    include: { pages: { select: pageSelect } },
  });

  res.status(201).json({ topicGroup: group });
});

router.patch(
  "/subjects/:subjectId/topic-groups/:groupId",
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { title } = req.body as { title?: string };
    if (!title?.trim()) {
      res.status(400).json({ error: "Title is required" });
      return;
    }
    const subject = await prisma.userSubject.findFirst({
      where: { id: param(req, "subjectId"), userId },
    });
    if (!subject) {
      res.status(404).json({ error: "Collection not found" });
      return;
    }
    const group = await prisma.userTopicGroup.findFirst({
      where: { id: param(req, "groupId"), userSubjectId: subject.id },
    });
    if (!group) {
      res.status(404).json({ error: "Topic not found" });
      return;
    }
    const updated = await prisma.userTopicGroup.update({
      where: { id: group.id },
      data: { title: title.trim() },
    });
    res.json({ topicGroup: updated });
  }
);

router.patch("/subjects/:id", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { name, description, icon } = req.body;

  const subject = await prisma.userSubject.findFirst({
    where: { id: param(req, "id"), userId },
  });
  if (!subject) {
    res.status(404).json({ error: "Collection not found" });
    return;
  }

  const updated = await prisma.userSubject.update({
    where: { id: subject.id },
    data: {
      name: name?.trim() ?? subject.name,
      description: description ?? subject.description,
      icon: icon ?? subject.icon,
    },
  });

  res.json({ subject: updated });
});

router.delete("/subjects/:id", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const subject = await prisma.userSubject.findFirst({
    where: { id: param(req, "id"), userId },
    include: {
      topics: true,
      topicGroups: { include: { pages: true } },
    },
  });
  if (!subject) {
    res.status(404).json({ error: "Collection not found" });
    return;
  }

  for (const page of subject.topics) {
    await deletePageAssets(userId, page);
    scheduleDeletePageVectors(page.id);
  }
  for (const group of subject.topicGroups) {
    for (const page of group.pages) {
      await deletePageAssets(userId, page);
      scheduleDeletePageVectors(page.id);
    }
  }

  await prisma.userSubject.delete({ where: { id: subject.id } });
  res.json({ success: true });
});

router.patch("/subjects/reorder", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { orderedIds } = req.body as { orderedIds?: string[] };
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      res.status(400).json({ error: "orderedIds required" });
      return;
    }

    const all = await prisma.userSubject.findMany({
      where: { userId },
      orderBy: { order: "asc" },
      select: { id: true },
    });
    const allIds = all.map((s) => s.id);
    const idSet = new Set(allIds);
    if (orderedIds.some((id) => !idSet.has(id))) {
      res.status(400).json({ error: "Invalid collection ids" });
      return;
    }

    const merged = mergeReorder(allIds, orderedIds);
    res.json({ success: true });

    void prisma
      .$transaction(
        merged.map((id, index) =>
          prisma.userSubject.update({
            where: { id },
            data: { order: index + 1 },
          })
        )
      )
      .catch((err) => {
        req.log?.error("my_content.subjects_reorder_async_failed", errorFields(err));
      });
  } catch (err) {
    req.log?.error("my_content.subjects_reorder_failed", errorFields(err));
    res.status(500).json({ error: "Could not reorder collections" });
  }
});

router.patch(
  "/subjects/:subjectId/topic-groups/reorder",
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const subject = await prisma.userSubject.findFirst({
        where: { id: param(req, "subjectId"), userId },
      });
      if (!subject) {
        res.status(404).json({ error: "Collection not found" });
        return;
      }

      const { orderedIds } = req.body as { orderedIds?: string[] };
      if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
        res.status(400).json({ error: "orderedIds required" });
        return;
      }

      const all = await prisma.userTopicGroup.findMany({
        where: { userSubjectId: subject.id },
        orderBy: { order: "asc" },
        select: { id: true },
      });
      const allIds = all.map((g) => g.id);
      const idSet = new Set(allIds);
      if (orderedIds.some((id) => !idSet.has(id))) {
        res.status(400).json({ error: "Invalid topic ids" });
        return;
      }

      const merged = mergeReorder(allIds, orderedIds);
      res.json({ success: true });

      void prisma
        .$transaction(
          merged.map((id, index) =>
            prisma.userTopicGroup.update({
              where: { id },
              data: { order: index + 1 },
            })
          )
        )
        .catch((err) => {
          req.log?.error("my_content.topics_reorder_async_failed", errorFields(err));
        });
    } catch (err) {
      req.log?.error("my_content.topics_reorder_failed", errorFields(err));
      res.status(500).json({ error: "Could not reorder topics" });
    }
  }
);

router.post("/bulk-delete", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const body = req.body as {
      subjectIds?: string[];
      topicGroups?: { subjectId: string; groupId: string }[];
      pageIds?: string[];
    };
    const { subjectIds, topicGroups, topicGroupKeys, pageIds } =
      normalizeBulkDeleteInput(body);

    const subjects = await loadBulkDeleteSubjects(userId, subjectIds);
    if (subjects.length !== subjectIds.length) {
      res.status(404).json({ error: "One or more collections not found" });
      return;
    }

    const groups = await loadBulkDeleteTopicGroups(userId, topicGroups);
    if (groups.length !== topicGroups.length) {
      res.status(404).json({ error: "One or more topics not found" });
      return;
    }

    const pages = await loadBulkDeletePages(userId, pageIds);
    if (pages.length !== pageIds.length) {
      res.status(404).json({ error: "One or more pages not found" });
      return;
    }

    res.json({ success: true });

    void (async () => {
      try {
        for (const subject of subjects) {
          for (const page of subject.topics) {
            await deletePageAssets(userId, page);
            scheduleDeletePageVectors(page.id);
          }
          for (const group of subject.topicGroups) {
            for (const page of group.pages) {
              await deletePageAssets(userId, page);
              scheduleDeletePageVectors(page.id);
            }
          }
          await prisma.userSubject.delete({ where: { id: subject.id } });
        }

        for (const group of groups) {
          for (const page of group.pages) {
            await deletePageAssets(userId, page);
            scheduleDeletePageVectors(page.id);
          }
          await prisma.userTopicGroup.delete({ where: { id: group.id } });
        }

        const subjectIdSet = new Set(subjectIds);
        for (const page of pages) {
          if (pageCoveredByBulkDelete(page, subjectIdSet, topicGroupKeys)) continue;
          await deletePageAssets(userId, page);
          scheduleDeletePageVectors(page.id);
          await prisma.userTopic.delete({ where: { id: page.id } });
        }
      } catch (err) {
        req.log?.error("my_content.bulk_delete_async_failed", errorFields(err));
      }
    })();
  } catch (err) {
    req.log?.error("my_content.bulk_delete_failed", errorFields(err));
    res.status(500).json({ error: "Could not delete selected items" });
  }
});

router.delete(
  "/subjects/:subjectId/topic-groups/:groupId",
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const subject = await prisma.userSubject.findFirst({
        where: { id: param(req, "subjectId"), userId },
      });
      if (!subject) {
        res.status(404).json({ error: "Collection not found" });
        return;
      }
      const group = await prisma.userTopicGroup.findFirst({
        where: { id: param(req, "groupId"), userSubjectId: subject.id },
        include: { pages: true },
      });
      if (!group) {
        res.status(404).json({ error: "Topic not found" });
        return;
      }
      for (const page of group.pages) {
        await deletePageAssets(userId, page);
      }
      await prisma.userTopicGroup.delete({ where: { id: group.id } });
      res.json({ success: true });
    } catch (err) {
      req.log?.error("my_content.topic_delete_failed", errorFields(err));
      res.status(500).json({ error: "Could not delete topic" });
    }
  }
);

router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  await handlePageUpload(req, res, rootPageParent(req.user!.userId));
});

router.post("/pages", async (req: Request, res: Response) => {
  await handlePageCreate(req, res, rootPageParent(req.user!.userId));
});

router.post(
  "/subjects/:subjectId/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    const parent = await notebookPageParent(
      req.user!.userId,
      param(req, "subjectId")
    );
    if (!parent) {
      res.status(404).json({ error: "Collection not found" });
      return;
    }
    await handlePageUpload(req, res, parent);
  }
);

router.post(
  "/subjects/:subjectId/pages",
  async (req: Request, res: Response) => {
    const parent = await notebookPageParent(
      req.user!.userId,
      param(req, "subjectId")
    );
    if (!parent) {
      res.status(404).json({ error: "Collection not found" });
      return;
    }
    await handlePageCreate(req, res, parent);
  }
);

router.post(
  "/subjects/:subjectId/topic-groups/:groupId/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    const parent = await topicPageParent(
      req.user!.userId,
      param(req, "subjectId"),
      param(req, "groupId")
    );
    if (!parent) {
      res.status(404).json({ error: "Collection or topic not found" });
      return;
    }
    await handlePageUpload(req, res, parent);
  }
);

router.post(
  "/subjects/:subjectId/topic-groups/:groupId/pages",
  async (req: Request, res: Response) => {
    const parent = await topicPageParent(
      req.user!.userId,
      param(req, "subjectId"),
      param(req, "groupId")
    );
    if (!parent) {
      res.status(404).json({ error: "Collection or topic not found" });
      return;
    }
    await handlePageCreate(req, res, parent);
  }
);

router.get("/file/:pageSlug", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const loaded = await loadPageInScope(
    userId,
    { kind: "root", userId },
    param(req, "pageSlug"),
    null,
    null
  );
  if (!loaded) {
    res.status(404).json({ error: "Page not found" });
    return;
  }
  await sendPageLoadResponse(res, loaded);
});

router.get(
  "/subjects/:notebookSlug/file/:pageSlug",
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const subject = await prisma.userSubject.findUnique({
      where: {
        userId_slug: { userId, slug: param(req, "notebookSlug") },
      },
    });
    if (!subject) {
      res.status(404).json({ error: "Page not found" });
      return;
    }
    const loaded = await loadPageInScope(
      userId,
      { kind: "notebook", userSubjectId: subject.id },
      param(req, "pageSlug"),
      subject.slug,
      null
    );
    if (!loaded) {
      res.status(404).json({ error: "Page not found" });
      return;
    }
    await sendPageLoadResponse(res, loaded);
  }
);

router.get(
  "/subjects/:notebookSlug/topics/:topicSlug/pages/:pageSlug",
  async (req: Request, res: Response) => {
    const loaded = await loadPageBySlugs(
      req.user!.userId,
      param(req, "notebookSlug"),
      param(req, "topicSlug"),
      param(req, "pageSlug")
    );
    if (!loaded) {
      res.status(404).json({ error: "Page not found" });
      return;
    }
    await sendPageLoadResponse(res, loaded);
  }
);

router.get(
  "/subjects/:subjectSlug/pages/:pageSlug",
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const subject = await prisma.userSubject.findUnique({
      where: { userId_slug: { userId, slug: param(req, "subjectSlug") } },
    });
    if (!subject) {
      res.status(404).json({ error: "Page not found" });
      return;
    }

    const page = await prisma.userTopic.findFirst({
      where: { userSubjectId: subject.id, slug: param(req, "pageSlug") },
      include: { userTopicGroup: { select: { slug: true } } },
    });
    if (!page) {
      res.status(404).json({ error: "Page not found" });
      return;
    }

    if (!page.userTopicGroupId || !page.userTopicGroup) {
      const loaded = await loadPageInScope(
        userId,
        { kind: "notebook", userSubjectId: subject.id },
        page.slug,
        subject.slug,
        null
      );
      if (!loaded) {
        res.status(404).json({ error: "Page not found" });
        return;
      }
      await sendPageLoadResponse(res, loaded);
      return;
    }

    const loaded = await loadPageBySlugs(
      userId,
      subject.slug,
      page.userTopicGroup.slug,
      page.slug
    );
    if (!loaded) {
      res.status(404).json({ error: "Page not found" });
      return;
    }
    await sendPageLoadResponse(res, loaded);
  }
);

async function streamPagePdf(req: Request, res: Response) {
  const userId = req.user!.userId;
  const access = await findAccessiblePage(userId, param(req, "id"), {
    linkToken: typeof req.query.t === "string" ? req.query.t : null,
  });
  const page = access?.page;
  if (!page?.pdfKey) {
    res.status(404).json({ error: "PDF not found" });
    return;
  }

  try {
    const meta = await headObjectMeta(page.pdfKey);
    const size = meta.contentLength;
    const contentType = meta.contentType || "application/pdf";
    const etagToken =
      meta.etag || `${page.pdfKey}:${page.fileSizeBytes || size}`;
    const etagHeader = `"${etagToken}"`;
    const rangeHeader = req.headers.range;
    const ifNoneMatch = req.headers["if-none-match"];

    // Override global no-store for immutable-ish user PDFs (private browser cache)
    res.setHeader("Cache-Control", "private, max-age=86400");
    res.setHeader("ETag", etagHeader);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", "inline");
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Accept-Ranges, Content-Range, Content-Length, Content-Type, ETag"
    );

    const clientTags = (ifNoneMatch || "")
      .split(",")
      .map((t) => t.trim().replace(/^W\//, "").replace(/"/g, ""));
    if (
      !rangeHeader &&
      clientTags.length > 0 &&
      (clientTags.includes(etagToken) || clientTags.includes("*"))
    ) {
      res.status(304).end();
      return;
    }

    if (req.method === "HEAD") {
      res.setHeader("Content-Length", String(size));
      res.status(200).end();
      return;
    }

    const parsed = parseBytesRange(rangeHeader, size);
    if (parsed === "unsatisfiable") {
      res.setHeader("Content-Range", `bytes */${size}`);
      res.status(416).end();
      return;
    }

    if (parsed) {
      const { start, end } = parsed;
      const { body, contentLength, contentRange } = await getObjectStream(
        page.pdfKey,
        { range: `bytes=${start}-${end}` }
      );
      res.status(206);
      res.setHeader(
        "Content-Range",
        contentRange ?? `bytes ${start}-${end}/${size}`
      );
      res.setHeader(
        "Content-Length",
        String(contentLength ?? end - start + 1)
      );
      body.pipe(res);
      return;
    }

    const { body, contentLength } = await getObjectStream(page.pdfKey);
    res.status(200);
    res.setHeader("Content-Length", String(contentLength ?? size));
    body.pipe(res);
  } catch (err) {
    req.log?.error("my_content.pdf_stream_failed", errorFields(err));
    if (!res.headersSent) {
      res.status(500).json({ error: "Could not load PDF" });
    } else {
      res.destroy();
    }
  }
}

router.get("/pages/:id/pdf-url", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const access = await findAccessiblePage(userId, param(req, "id"), {
    linkToken: typeof req.query.t === "string" ? req.query.t : null,
  });
  const page = access?.page;
  if (!page?.pdfKey) {
    res.status(404).json({ error: "PDF not found" });
    return;
  }
  try {
    const url = await getPresignedPdfGetUrl(page.pdfKey);
    res.json({
      url,
      expiresIn: PDF_PRESIGN_EXPIRES_SEC,
      version: `${page.pdfKey}:${page.fileSizeBytes}`,
    });
  } catch (err) {
    req.log?.error("my_content.pdf_presign_failed", errorFields(err));
    res.status(500).json({ error: "Could not open PDF" });
  }
});

router.get("/pages/:id/pdf", streamPagePdf);
router.head("/pages/:id/pdf", streamPagePdf);

router.patch("/pages/:id/progress", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const page = await prisma.userTopic.findFirst({
      where: { id: param(req, "id"), userId },
    });
    if (!page) {
      res.status(404).json({ error: "Page not found" });
      return;
    }

    const { completed, readPercent, view } = req.body as {
      completed?: boolean;
      readPercent?: number;
      view?: unknown;
    };

    const parsedView = parsePageView(view);
    const viewData =
      view != null && typeof view === "object" && !Array.isArray(view)
        ? {
            ...(parsedView && hasParsedPageView(parsedView) ? parsedView : {}),
            viewedAt: new Date(),
          }
        : {};

    const updated = await prisma.userTopic.update({
      where: { id: page.id },
      data: {
        completed: completed ?? undefined,
        readPercent: readPercent ?? undefined,
        completedAt:
          completed === true
            ? new Date()
            : completed === false
              ? null
              : undefined,
        ...viewData,
      },
      select: {
        id: true,
        completed: true,
        readPercent: true,
        starred: true,
        viewPdfPage: true,
        viewPageOffset: true,
        viewScrollTop: true,
        viewScale: true,
        viewedAt: true,
      },
    });

    res.json({ topic: updated, page: updated });
  } catch (err) {
    req.log?.error("my_content.progress_failed", errorFields(err));
    res.status(500).json({ error: "Could not update progress" });
  }
});

router.patch("/pages/:id/title", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { title } = req.body as { title?: string };
    if (!title?.trim()) {
      res.status(400).json({ error: "Title is required" });
      return;
    }
    const page = await prisma.userTopic.findFirst({
      where: { id: param(req, "id"), userId },
    });
    if (!page) {
      res.status(404).json({ error: "Page not found" });
      return;
    }
    const updated = await prisma.userTopic.update({
      where: { id: page.id },
      data: { title: title.trim() },
      select: { id: true, title: true },
    });
    res.json({ page: updated });
  } catch (err) {
    req.log?.error("my_content.title_failed", errorFields(err));
    res.status(500).json({ error: "Could not rename page" });
  }
});

router.post("/pages/:id/star", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const page = await prisma.userTopic.findFirst({
      where: { id: param(req, "id"), userId },
    });
    if (!page) {
      res.status(404).json({ error: "Page not found" });
      return;
    }

    const starred = !page.starred;
    const updated = await prisma.userTopic.update({
      where: { id: page.id },
      data: { starred },
      select: { id: true, starred: true },
    });

    res.json(updated);
  } catch (err) {
    req.log?.error("my_content.star_failed", errorFields(err));
    res.status(500).json({ error: "Could not update star" });
  }
});

router.patch("/pages/:id/content", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { htmlContent } = req.body as { htmlContent?: string };

    if (!htmlContent?.trim()) {
      res.status(400).json({ error: "htmlContent required" });
      return;
    }

    const page = await prisma.userTopic.findFirst({
      where: { id: param(req, "id"), userId },
      include: {
        userSubject: { select: { slug: true } },
        userTopicGroup: { select: { slug: true } },
      },
    });
    if (!page) {
      res.status(404).json({ error: "Page not found" });
      return;
    }
    if (page.contentType === "PDF" || page.contentType === "LINK") {
      res.status(400).json({ error: "This page cannot be edited as HTML" });
      return;
    }

    const html = sanitizeStoredHtml(htmlContent.trim());
    const newBytes = Buffer.byteLength(html, "utf8");
    const oldBytes = page.fileSizeBytes ?? 0;
    const delta = newBytes - oldBytes;

    if (delta > 0) {
      try {
        await chargeStorage(userId, delta);
      } catch (err) {
        if (err instanceof QuotaError) {
          res.status(err.status).json({ error: err.message });
          return;
        }
        throw err;
      }
    } else if (delta < 0) {
      await releaseStorage(userId, -delta);
    }

    let contentKey = page.contentUrl;
    if (!contentKey) {
      contentKey = contentHtmlKey(
        userDocPrefix(
          userId,
          page.userSubject?.slug ?? null,
          page.userTopicGroup?.slug ?? null,
          page.slug
        )
      );
    }

    await uploadToS3(contentKey, html, "text/html");

    await prisma.userContentHighlight.deleteMany({
      where: { userTopicId: page.id, kind: "TEXT" },
    });

    await prisma.userTopic.update({
      where: { id: page.id },
      data: {
        contentUrl: contentKey,
        fileSizeBytes: newBytes,
        status: "PUBLISHED",
      },
    });

    scheduleIndexPage(page.id);
    res.json({ success: true, content: html });
  } catch (err) {
    req.log?.error("my_content.content_update_failed", errorFields(err));
    res.status(500).json({ error: "Could not save content" });
  }
});

router.patch("/pages/:id/source", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { sourceUrl: rawSourceUrl, title } = req.body as {
      sourceUrl?: string;
      title?: string;
    };
    const sourceUrl = parsePublicHttpUrl(String(rawSourceUrl ?? ""));
    if (!sourceUrl) {
      res.status(400).json({
        error: "Enter a public http(s) link to a website or PDF.",
      });
      return;
    }

    const page = await prisma.userTopic.findFirst({
      where: { id: param(req, "id"), userId },
    });
    if (!page) {
      res.status(404).json({ error: "Page not found" });
      return;
    }
    if (page.contentType !== "LINK") {
      res.status(400).json({ error: "Only linked pages can change URL" });
      return;
    }

    const nextTitle = title?.trim() ? title.trim() : page.title;
    const updated = await prisma.userTopic.update({
      where: { id: page.id },
      data: { sourceUrl, title: nextTitle, status: "PUBLISHED" },
    });
    scheduleIndexPage(updated.id);
    res.json({
      success: true,
      sourceUrl: updated.sourceUrl,
      title: updated.title,
    });
  } catch (err) {
    req.log?.error("my_content.source_update_failed", errorFields(err));
    res.status(500).json({ error: "Could not update link" });
  }
});

/** Fetch a LINK page URL and store it as PDF or HTML in Shelf. */
router.post("/pages/:id/import", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  try {
    const page = await prisma.userTopic.findFirst({
      where: { id: param(req, "id"), userId },
      include: {
        userSubject: { select: { slug: true } },
        userTopicGroup: { select: { slug: true } },
      },
    });
    if (!page) {
      res.status(404).json({ error: "Page not found" });
      return;
    }
    if (page.contentType !== "LINK") {
      res.status(400).json({
        error: "Only linked pages can be imported. This page is already in Shelf.",
      });
      return;
    }
    if (!page.sourceUrl) {
      res.status(400).json({ error: "This linked page has no URL." });
      return;
    }

    const remote = await fetchRemoteDocument(page.sourceUrl);
    const docPrefix = userDocPrefix(
      userId,
      page.userSubject?.slug ?? null,
      page.userTopicGroup?.slug ?? null,
      page.slug
    );

    let storePdf: Buffer | null = null;
    let importHtml: string | null = null;
    if (remote.kind === "pdf") {
      storePdf = await losslessCompressBuffer(
        remote.buffer,
        "application/pdf"
      );
    } else {
      importHtml = remote.html;
    }
    const bytes = storePdf
      ? storePdf.length
      : Buffer.byteLength(importHtml ?? "", "utf8");

    try {
      await chargeStorage(userId, bytes);
    } catch (err) {
      if (err instanceof QuotaError) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      throw err;
    }

    try {
      if (storePdf) {
        const pdfKey = sourcePdfKey(docPrefix);
        await uploadToS3(pdfKey, storePdf, "application/pdf");
        const updated = await prisma.userTopic.update({
          where: { id: page.id },
          data: {
            pdfKey,
            contentUrl: null,
            contentType: "PDF",
            fileSizeBytes: bytes,
            status: "PUBLISHED",
            sourceUrl: remote.finalUrl || page.sourceUrl,
          },
          select: pageSelect,
        });
        scheduleIndexPage(updated.id);
        res.json({
          page: updated,
          message: "PDF imported. You can highlight and ask Study AI on it now.",
        });
        return;
      }

      const contentKey = contentHtmlKey(docPrefix);
      await uploadToS3(contentKey, importHtml ?? "", "text/html");
      const nextTitle =
        page.title.trim().toLowerCase() === "untitled" && remote.titleHint
          ? remote.titleHint
          : page.title;
      const updated = await prisma.userTopic.update({
        where: { id: page.id },
        data: {
          contentUrl: contentKey,
          pdfKey: null,
          contentType: "HTML",
          fileSizeBytes: bytes,
          status: "PUBLISHED",
          sourceUrl: remote.finalUrl || page.sourceUrl,
          title: nextTitle,
        },
        select: pageSelect,
      });
      scheduleIndexPage(updated.id);
      res.json({
        page: updated,
        message:
          "Page imported. You can highlight and send selection to Study AI now.",
      });
    } catch (err) {
      await releaseStorage(userId, bytes);
      throw err;
    }
  } catch (err) {
    if (err instanceof ImportLinkError) {
      res.status(err.status).json({ error: err.message, code: err.code });
      return;
    }
    req.log?.error("my_content.import_failed", errorFields(err));
    res.status(500).json({ error: "Could not import this link" });
  }
});

/** Whether this linked page can load inside Shelf’s iframe. */
router.get("/pages/:id/embed-status", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const page = await prisma.userTopic.findFirst({
      where: { id: param(req, "id"), userId },
      select: { contentType: true, sourceUrl: true },
    });
    if (!page) {
      res.status(404).json({ error: "Page not found" });
      return;
    }
    if (page.contentType !== "LINK" || !page.sourceUrl) {
      res.json({ embeddable: true, finalUrl: page.sourceUrl ?? null });
      return;
    }
    const result = await checkUrlEmbeddable(page.sourceUrl);
    res.json(result);
  } catch (err) {
    req.log?.error("my_content.embed_status_failed", errorFields(err));
    res.json({ embeddable: true, finalUrl: null });
  }
});

router.delete("/pages/:id", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const page = await prisma.userTopic.findFirst({
    where: { id: param(req, "id"), userId },
  });
  if (!page) {
    res.status(404).json({ error: "Page not found" });
    return;
  }

  await deletePageAssets(userId, page);
  scheduleDeletePageVectors(page.id);
  await prisma.userTopic.delete({ where: { id: page.id } });
  res.json({ success: true });
});

router.get("/pages/:topicId/highlights", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const access = await findAccessiblePage(userId, param(req, "topicId"), {
    linkToken: typeof req.query.t === "string" ? req.query.t : null,
  });
  if (!access) {
    res.status(404).json({ error: "Page not found" });
    return;
  }

  const highlights = await prisma.userContentHighlight.findMany({
    where: { userId, userTopicId: access.page.id },
    orderBy: { createdAt: "asc" },
  });
  res.json({ highlights });
});

router.post("/highlights", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const {
    userTopicId,
    text,
    startOffset,
    endOffset,
    color,
    note,
    kind,
    pageNumber,
    position,
  } = req.body;

  const access = await findAccessiblePage(userId, String(userTopicId), {
    linkToken: typeof req.body?.t === "string" ? req.body.t : null,
  });
  if (!access || !canAnnotate(access.role)) {
    res.status(404).json({ error: "Page not found" });
    return;
  }
  const page = access.page;

  const highlight = await prisma.userContentHighlight.create({
    data: {
      userId,
      userTopicId,
      text: text ?? "",
      startOffset: startOffset ?? 0,
      endOffset: endOffset ?? 0,
      color: color ?? "yellow",
      note: typeof note === "string" ? note.slice(0, 8000) : note,
      kind: kind === "REGION" ? "REGION" : "TEXT",
      pageNumber: pageNumber ?? null,
      position: position ?? null,
    },
  });
  scheduleIndexPage(page.id);
  res.status(201).json({ highlight });
});

router.patch("/highlights/:id", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const highlight = await prisma.userContentHighlight.findFirst({
    where: { id: param(req, "id"), userId },
  });
  if (!highlight) {
    res.status(404).json({ error: "Highlight not found" });
    return;
  }
  const note =
    req.body?.note === undefined
      ? undefined
      : req.body.note == null || String(req.body.note).trim() === ""
        ? null
        : String(req.body.note).slice(0, 8000);
  const updated = await prisma.userContentHighlight.update({
    where: { id: highlight.id },
    data: note === undefined ? {} : { note },
  });
  if (note !== undefined) {
    scheduleIndexPage(highlight.userTopicId);
  }
  res.json({ highlight: updated });
});

router.delete("/highlights/:id", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const highlight = await prisma.userContentHighlight.findFirst({
    where: { id: param(req, "id"), userId },
  });
  if (!highlight) {
    res.status(404).json({ error: "Highlight not found" });
    return;
  }
  const pageId = highlight.userTopicId;
  await prisma.userContentHighlight.delete({ where: { id: highlight.id } });
  scheduleIndexPage(pageId);
  res.json({ success: true });
});

export default router;
