import type { Request, Response, Router } from "express";
import prisma from "../utils/prisma.js";
import { optionalAuthMiddleware } from "../middleware/auth.js";
import {
  curriculumEmbedUrl,
  isPdfUrl,
} from "../services/curriculumSavePolicy.js";
import { pipeRemoteSourcePdf } from "../services/curriculumSourcePdfStream.js";
import {
  getObjectStream,
  getPresignedPdfGetUrl,
  headObjectMeta,
  PDF_PRESIGN_EXPIRES_SEC,
} from "../services/s3.js";
import { isPremiumUser } from "../utils/paywall.js";
import { param } from "../utils/param.js";
import { parseBytesRange } from "../utils/byteRange.js";

async function resolveArticleBySlugs(
  subjectSlug: string,
  topicSlug: string,
  articleSlug: string
) {
  const subject = await prisma.subject.findUnique({
    where: { slug: subjectSlug },
  });
  if (!subject) return null;

  const topic = await prisma.topic.findUnique({
    where: {
      subjectId_slug: {
        subjectId: subject.id,
        slug: topicSlug,
      },
    },
  });
  if (!topic) return null;

  const article = await prisma.article.findUnique({
    where: {
      topicId_slug: {
        topicId: topic.id,
        slug: articleSlug,
      },
    },
    include: {
      topic: {
        select: {
          title: true,
          slug: true,
          subject: { select: { name: true, slug: true, icon: true, studyGoal: true } },
        },
      },
    },
  });
  if (!article) return null;
  return { subject, topic, article };
}

type ResolvedArticle = NonNullable<
  Awaited<ReturnType<typeof resolveArticleBySlugs>>
>;

async function authorizeArticlePdf(
  req: Request,
  res: Response
): Promise<ResolvedArticle | null> {
  const resolved = await resolveArticleBySlugs(
    param(req, "subjectSlug"),
    param(req, "topicSlug"),
    param(req, "articleSlug")
  );
  if (!resolved || resolved.article.status !== "PUBLISHED") {
    res.status(404).json({ error: "PDF not found" });
    return null;
  }

  const embedUrl = curriculumEmbedUrl(resolved.article);
  const hasPdf =
    Boolean(resolved.article.pdfKey) ||
    Boolean(embedUrl && isPdfUrl(embedUrl));
  if (!hasPdf) {
    res.status(404).json({ error: "PDF not found" });
    return null;
  }

  const userId = req.user?.userId;
  const dbUser = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true, role: true, subscriptionExpiresAt: true },
      })
    : null;
  const userIsPremium = dbUser ? isPremiumUser(dbUser) : false;
  if (resolved.article.isPremium && !userIsPremium) {
    res.status(403).json({ error: "Premium article" });
    return null;
  }
  return resolved;
}

async function streamArticlePdfFromS3(
  req: Request,
  res: Response,
  pdfKey: string
): Promise<void> {
  try {
    const meta = await headObjectMeta(pdfKey);
    const size = meta.contentLength;
    const contentType = meta.contentType || "application/pdf";
    const etagToken = meta.etag || pdfKey;
    const etagHeader = `"${etagToken}"`;
    const rangeHeader = req.headers.range;
    const ifNoneMatch = req.headers["if-none-match"];

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
        pdfKey,
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

    const { body, contentLength } = await getObjectStream(pdfKey);
    res.status(200);
    res.setHeader("Content-Length", String(contentLength ?? size));
    body.pipe(res);
  } catch {
    res.status(500).json({ error: "Failed to stream PDF" });
  }
}

export function registerSubjectArticlePdfRoutes(
  router: Router,
  apiBase: (req: Request) => string
): void {
  async function sendArticlePdfUrl(req: Request, res: Response) {
    const resolved = await authorizeArticlePdf(req, res);
    if (!resolved) return;

    if (resolved.article.pdfKey) {
      try {
        const url = await getPresignedPdfGetUrl(resolved.article.pdfKey);
        res.json({
          url,
          expiresIn: PDF_PRESIGN_EXPIRES_SEC,
          version: resolved.article.pdfKey,
        });
      } catch {
        res.status(500).json({ error: "Could not open PDF" });
      }
      return;
    }

    const embedUrl = curriculumEmbedUrl(resolved.article);
    if (!embedUrl || !isPdfUrl(embedUrl)) {
      res.status(404).json({ error: "PDF not found" });
      return;
    }

    const subjectSlug = param(req, "subjectSlug");
    const topicSlug = param(req, "topicSlug");
    const articleSlug = param(req, "articleSlug");
    const base = apiBase(req);
    res.json({
      url: `${base}/api/subjects/${encodeURIComponent(subjectSlug)}/topics/${encodeURIComponent(topicSlug)}/articles/${encodeURIComponent(articleSlug)}/pdf`,
      expiresIn: PDF_PRESIGN_EXPIRES_SEC,
      version: embedUrl,
    });
  }

  async function streamArticlePdf(req: Request, res: Response) {
    const resolved = await authorizeArticlePdf(req, res);
    if (!resolved) return;

    if (resolved.article.pdfKey) {
      await streamArticlePdfFromS3(req, res, resolved.article.pdfKey);
      return;
    }

    const embedUrl = curriculumEmbedUrl(resolved.article);
    if (!embedUrl || !isPdfUrl(embedUrl)) {
      res.status(404).json({ error: "PDF not found" });
      return;
    }

    await pipeRemoteSourcePdf(req, res, embedUrl);
  }

  router.get(
    "/:subjectSlug/topics/:topicSlug/articles/:articleSlug/pdf-url",
    optionalAuthMiddleware,
    sendArticlePdfUrl
  );
  router.get(
    "/:subjectSlug/topics/:topicSlug/articles/:articleSlug/pdf",
    optionalAuthMiddleware,
    streamArticlePdf
  );
  router.head(
    "/:subjectSlug/topics/:topicSlug/articles/:articleSlug/pdf",
    optionalAuthMiddleware,
    streamArticlePdf
  );
}
