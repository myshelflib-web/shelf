import { Router, Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { param } from "../utils/param.js";
import {
  formatBibliography,
  formatInText,
  type CiteAuthor,
  type CiteStyle,
} from "../services/citationFormat.js";
import { parseBibtex, parseCslJson } from "../services/bibtexParse.js";

const router = Router();
router.use(authMiddleware);

const STYLES = new Set<CiteStyle>(["apa", "mla", "chicago", "ieee"]);

function asAuthors(raw: unknown): CiteAuthor[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((a) => {
    const o = a as Record<string, string>;
    return {
      family: o.family,
      given: o.given,
      literal: o.literal,
    };
  });
}

function sourceSelect() {
  return {
    id: true,
    title: true,
    authors: true,
    year: true,
    doi: true,
    url: true,
    container: true,
    pages: true,
    type: true,
    bibtexKey: true,
    pageId: true,
    createdAt: true,
    updatedAt: true,
  } as const;
}

router.get("/citations", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const q = String(req.query.q ?? "").trim();
  const sources = await prisma.citationSource.findMany({
    where: {
      userId,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { bibtexKey: { contains: q, mode: "insensitive" } },
              { container: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: sourceSelect(),
  });
  res.json({ sources });
});

router.post("/citations", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const body = req.body as Record<string, unknown>;
  const title = String(body.title ?? "").trim();
  if (!title) {
    res.status(400).json({ error: "title required" });
    return;
  }
  const source = await prisma.citationSource.create({
    data: {
      userId,
      title,
      authors: asAuthors(body.authors) as object[],
      year: body.year ? String(body.year).trim() : null,
      doi: body.doi ? String(body.doi).trim() : null,
      url: body.url ? String(body.url).trim() : null,
      container: body.container ? String(body.container).trim() : null,
      pages: body.pages ? String(body.pages).trim() : null,
      type: String(body.type ?? "article").trim() || "article",
      bibtexKey: body.bibtexKey ? String(body.bibtexKey).trim() : null,
      pageId: body.pageId ? String(body.pageId).trim() : null,
      rawCsl: body.rawCsl ? (body.rawCsl as object) : undefined,
    },
    select: sourceSelect(),
  });
  res.status(201).json({ source });
});

router.post("/citations/import", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const body = req.body as { text?: string; format?: string };
  const text = String(body.text ?? "").trim();
  if (!text) {
    res.status(400).json({ error: "text required" });
    return;
  }
  const format = String(body.format ?? "bibtex").toLowerCase();
  let parsed;
  try {
    parsed = format === "csl-json" ? parseCslJson(text) : parseBibtex(text);
  } catch {
    res.status(400).json({ error: "Could not parse import text" });
    return;
  }
  if (parsed.length === 0) {
    res.status(400).json({ error: "No entries found" });
    return;
  }
  const created = [];
  for (const e of parsed.slice(0, 200)) {
    const source = await prisma.citationSource.create({
      data: {
        userId,
        title: e.title,
        authors: e.authors as object[],
        year: e.year ?? null,
        doi: e.doi ?? null,
        url: e.url ?? null,
        container: e.container ?? null,
        pages: e.pages ?? null,
        type: e.type || "article",
        bibtexKey: e.bibtexKey,
      },
      select: sourceSelect(),
    });
    created.push(source);
  }
  res.status(201).json({ sources: created, count: created.length });
});

router.post("/citations/format", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const body = req.body as {
    style?: string;
    cites?: Array<{ sourceId: string; locator?: string }>;
  };
  const styleRaw = String(body.style ?? "apa").toLowerCase() as CiteStyle;
  const style = STYLES.has(styleRaw) ? styleRaw : "apa";
  const cites = Array.isArray(body.cites) ? body.cites : [];
  const ids = cites.map((c) => c.sourceId).filter(Boolean);
  const rows = await prisma.citationSource.findMany({
    where: { userId, id: { in: ids } },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  const inputs = cites
    .map((c) => {
      const r = byId.get(c.sourceId);
      if (!r) return null;
      return {
        id: r.id,
        title: r.title,
        authors: asAuthors(r.authors),
        year: r.year,
        container: r.container,
        pages: r.pages,
        doi: r.doi,
        url: r.url,
        type: r.type,
        bibtexKey: r.bibtexKey,
        locator: c.locator ?? null,
      };
    })
    .filter(Boolean);
  res.json({
    style,
    inText: formatInText(inputs as never[], style),
    bibliography: formatBibliography(inputs as never[], style),
    entries: (inputs as never[]).map((s, i) => ({
      sourceId: (s as { id: string }).id,
      html: formatBibliography(
        [s as never],
        style
      ),
      index: i + 1,
    })),
  });
});

router.patch("/citations/:id", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = param(req, "id");
  const existing = await prisma.citationSource.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const body = req.body as Record<string, unknown>;
  const source = await prisma.citationSource.update({
    where: { id },
    data: {
      ...(body.title != null ? { title: String(body.title).trim() } : {}),
      ...(body.authors != null
        ? { authors: asAuthors(body.authors) as object[] }
        : {}),
      ...(body.year !== undefined
        ? { year: body.year ? String(body.year).trim() : null }
        : {}),
      ...(body.doi !== undefined
        ? { doi: body.doi ? String(body.doi).trim() : null }
        : {}),
      ...(body.url !== undefined
        ? { url: body.url ? String(body.url).trim() : null }
        : {}),
      ...(body.container !== undefined
        ? { container: body.container ? String(body.container).trim() : null }
        : {}),
      ...(body.pages !== undefined
        ? { pages: body.pages ? String(body.pages).trim() : null }
        : {}),
      ...(body.type != null ? { type: String(body.type).trim() } : {}),
      ...(body.bibtexKey !== undefined
        ? { bibtexKey: body.bibtexKey ? String(body.bibtexKey).trim() : null }
        : {}),
    },
    select: sourceSelect(),
  });
  res.json({ source });
});

router.delete("/citations/:id", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = param(req, "id");
  const existing = await prisma.citationSource.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await prisma.citationSource.delete({ where: { id } });
  res.json({ success: true });
});

router.post(
  "/pages/:id/sources/:sourceId",
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const pageId = param(req, "id");
    const sourceId = param(req, "sourceId");
    const page = await prisma.userTopic.findFirst({
      where: { id: pageId, userId },
      select: { id: true },
    });
    const source = await prisma.citationSource.findFirst({
      where: { id: sourceId, userId },
      select: { id: true },
    });
    if (!page || !source) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const link = await prisma.docSourceLink.upsert({
      where: { pageId_sourceId: { pageId, sourceId } },
      create: { pageId, sourceId },
      update: {},
    });
    res.json({ link });
  }
);

router.get("/pages/:id/sources", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const pageId = param(req, "id");
  const page = await prisma.userTopic.findFirst({
    where: { id: pageId, userId },
    select: { id: true },
  });
  if (!page) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const links = await prisma.docSourceLink.findMany({
    where: { pageId },
    include: { source: { select: sourceSelect() } },
  });
  res.json({ sources: links.map((l) => l.source) });
});

export default router;
