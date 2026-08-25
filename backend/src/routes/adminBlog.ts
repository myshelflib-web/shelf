import { Router, Request } from "express";
import multer from "multer";
import prisma from "../utils/prisma.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import { slugify } from "../utils/slugify.js";
import { param } from "../utils/param.js";
import {
  blogCoverKey,
  blogHeroKey,
  blogSectionIllustrationKey,
  coverExtFromMime,
} from "../utils/blogPaths.js";
import {
  readBlogContent,
  uploadBlogAsset,
  writeBlogContent,
} from "../services/blog/storage.js";
import { parseBlogContent } from "../services/blog/types.js";
import { deleteFromS3 } from "../services/s3.js";
import { blogHeroSvg, blogSectionSvg } from "../services/blog/illustrations.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

function apiBase(req: Request): string {
  const env = process.env.API_PUBLIC_URL?.replace(/\/$/, "");
  if (env) return env;
  const host = req.get("host");
  const proto = req.get("x-forwarded-proto") ?? req.protocol;
  return host ? `${proto}://${host}` : "http://localhost:4000";
}

router.get("/", authMiddleware, adminMiddleware, async (_req, res) => {
  const posts = await prisma.blogPost.findMany({
    orderBy: { updatedAt: "desc" },
  });
  res.json({
    posts: posts.map((p) => ({
      ...p,
      publishedAt: p.publishedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
  });
});

router.get("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const id = param(req, "id");
  const row = await prisma.blogPost.findUnique({ where: { id } });
  if (!row) {
    res.status(404).json({ error: "Blog post not found" });
    return;
  }
  const content = await readBlogContent(row.contentKey);
  res.json({
    post: {
      ...row,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      content,
      coverImageUrl: row.coverImageKey
        ? `${apiBase(req)}/api/blog/media/${encodeURIComponent(row.coverImageKey)}`
        : null,
      heroIllustrationUrl: row.heroImageKey
        ? `${apiBase(req)}/api/blog/media/${encodeURIComponent(row.heroImageKey)}`
        : null,
    },
  });
});

router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  const {
    title,
    slug: rawSlug,
    description,
    excerpt,
    tags,
    readingMinutes,
    status,
    sections,
  } = req.body as {
    title?: string;
    slug?: string;
    description?: string;
    excerpt?: string;
    tags?: string[];
    readingMinutes?: number;
    status?: "DRAFT" | "PUBLISHED";
    sections?: unknown;
  };

  if (!title?.trim() || !description?.trim() || !excerpt?.trim()) {
    res.status(400).json({ error: "title, description, and excerpt required" });
    return;
  }

  const slug = slugify(rawSlug?.trim() || title);
  const existing = await prisma.blogPost.findUnique({ where: { slug } });
  if (existing) {
    res.status(409).json({ error: "Slug already in use" });
    return;
  }

  let content;
  try {
    content = parseBlogContent({ sections: sections ?? [] });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : "Invalid sections",
    });
    return;
  }

  const heroKey = blogHeroKey(slug);
  await uploadBlogAsset(heroKey, Buffer.from(blogHeroSvg(slug), "utf8"), "image/svg+xml");

  const enriched = await enrichSectionIllustrations(slug, content);
  const contentKey = await writeBlogContent(slug, enriched);

  const published = status === "PUBLISHED";
  const row = await prisma.blogPost.create({
    data: {
      slug,
      title: title.trim(),
      description: description.trim(),
      excerpt: excerpt.trim(),
      tags: Array.isArray(tags) ? tags.map(String) : [],
      readingMinutes: readingMinutes ?? 5,
      status: published ? "PUBLISHED" : "DRAFT",
      contentKey,
      heroImageKey: heroKey,
      publishedAt: published ? new Date() : null,
      authorId: req.user!.userId,
    },
  });

  res.status(201).json({
    post: {
      ...row,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  });
});

router.patch("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const id = param(req, "id");
  const row = await prisma.blogPost.findUnique({ where: { id } });
  if (!row) {
    res.status(404).json({ error: "Blog post not found" });
    return;
  }

  const {
    title,
    slug: rawSlug,
    description,
    excerpt,
    tags,
    readingMinutes,
    status,
    sections,
  } = req.body as {
    title?: string;
    slug?: string;
    description?: string;
    excerpt?: string;
    tags?: string[];
    readingMinutes?: number;
    status?: "DRAFT" | "PUBLISHED";
    sections?: unknown;
  };

  const data: {
    title?: string;
    slug?: string;
    description?: string;
    excerpt?: string;
    tags?: string[];
    readingMinutes?: number;
    status?: "DRAFT" | "PUBLISHED";
    publishedAt?: Date | null;
    contentKey?: string;
  } = {};

  if (title !== undefined) data.title = title.trim();
  if (description !== undefined) data.description = description.trim();
  if (excerpt !== undefined) data.excerpt = excerpt.trim();
  if (tags !== undefined) data.tags = tags.map(String);
  if (readingMinutes !== undefined) data.readingMinutes = readingMinutes;

  let slug = row.slug;
  if (rawSlug !== undefined) {
    slug = slugify(rawSlug.trim() || row.title);
    if (slug !== row.slug) {
      const clash = await prisma.blogPost.findUnique({ where: { slug } });
      if (clash) {
        res.status(409).json({ error: "Slug already in use" });
        return;
      }
      data.slug = slug;
    }
  }

  if (status !== undefined) {
    data.status = status;
    if (status === "PUBLISHED" && !row.publishedAt) {
      data.publishedAt = new Date();
    }
    if (status === "DRAFT") {
      data.publishedAt = null;
    }
  }

  if (sections !== undefined) {
    let content;
    try {
      content = parseBlogContent({ sections });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : "Invalid sections",
      });
      return;
    }
    const enriched = await enrichSectionIllustrations(slug, content);
    data.contentKey = await writeBlogContent(slug, enriched);
  }

  const updated = await prisma.blogPost.update({ where: { id }, data });
  res.json({
    post: {
      ...updated,
      publishedAt: updated.publishedAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
});

router.post(
  "/:id/cover",
  authMiddleware,
  adminMiddleware,
  upload.single("cover"),
  async (req, res) => {
    const id = param(req, "id");
    const file = req.file;
    if (!file || !file.mimetype.startsWith("image/")) {
      res.status(400).json({ error: "Image file required" });
      return;
    }
    const row = await prisma.blogPost.findUnique({ where: { id } });
    if (!row) {
      res.status(404).json({ error: "Blog post not found" });
      return;
    }
    const ext = coverExtFromMime(file.mimetype);
    const key = blogCoverKey(row.slug, ext);
    await uploadBlogAsset(key, file.buffer, file.mimetype);
    const updated = await prisma.blogPost.update({
      where: { id },
      data: { coverImageKey: key },
    });
    res.json({
      post: updated,
      coverImageUrl: `${apiBase(req)}/api/blog/media/${encodeURIComponent(key)}`,
    });
  }
);

router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const id = param(req, "id");
  const row = await prisma.blogPost.findUnique({ where: { id } });
  if (!row) {
    res.status(404).json({ error: "Blog post not found" });
    return;
  }
  await prisma.blogPost.delete({ where: { id } });
  void deleteFromS3(row.contentKey).catch(() => {});
  if (row.coverImageKey) void deleteFromS3(row.coverImageKey).catch(() => {});
  if (row.heroImageKey) void deleteFromS3(row.heroImageKey).catch(() => {});
  res.json({ ok: true });
});

async function enrichSectionIllustrations(
  slug: string,
  content: ReturnType<typeof parseBlogContent>
) {
  const sections = await Promise.all(
    content.sections.map(async (section, index) => {
      if (section.illustrationKey) return section;
      const key = blogSectionIllustrationKey(slug, index);
      await uploadBlogAsset(
        key,
        Buffer.from(blogSectionSvg(index), "utf8"),
        "image/svg+xml"
      );
      return { ...section, illustrationKey: key };
    })
  );
  return { sections };
}

export default router;
