import { Router, Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { getObjectBuffer } from "../services/s3.js";
import { isSafeBlogMediaKey } from "../utils/blogPaths.js";
import { toBlogPublic, toBlogSummary } from "../services/blog/present.js";
import { param } from "../utils/param.js";

const router = Router();

function apiBase(req: Request): string {
  const env = process.env.API_PUBLIC_URL?.replace(/\/$/, "");
  if (env) return env;
  const host = req.get("host");
  const proto = req.get("x-forwarded-proto") ?? req.protocol;
  return host ? `${proto}://${host}` : "http://localhost:4000";
}

router.get("/", async (req: Request, res: Response) => {
  const rows = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
  res.json({
    posts: rows.map((row) => toBlogSummary(row, apiBase(req))),
  });
});

router.get(/^\/media\/(.+)$/, async (req: Request, res: Response) => {
  const key = req.params[0] ?? "";
  if (!isSafeBlogMediaKey(key)) {
    res.status(400).json({ error: "Invalid media key" });
    return;
  }
  try {
    const { buffer, contentType } = await getObjectBuffer(key);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    res.send(buffer);
  } catch {
    res.status(404).json({ error: "Media not found" });
  }
});

router.get("/:slug", async (req: Request, res: Response) => {
  const slug = param(req, "slug");
  const row = await prisma.blogPost.findFirst({
    where: { slug, status: "PUBLISHED" },
  });
  if (!row) {
    res.status(404).json({ error: "Blog post not found" });
    return;
  }
  const post = await toBlogPublic(row, apiBase(req));
  res.json({ post });
});

export default router;
