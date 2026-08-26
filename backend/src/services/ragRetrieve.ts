import prisma from "../utils/prisma.js";
import { pageHref } from "../utils/docPaths.js";
import { getFromS3 } from "./s3.js";
import { htmlToPlainText, truncateText } from "../utils/htmlText.js";
import { logger, errorFields } from "../utils/logger.js";
import { embedTexts } from "./embeddings.js";
import { isVectorConfigured, searchVectors } from "./vectorStore.js";
import {
  diversifyExcerpts,
  reciprocalRankFusion,
  type RankedExcerpt,
} from "../utils/ragFusion.js";

export type Excerpt = RankedExcerpt;

export type LibraryCitation = {
  n: number;
  pageId: string;
  title: string;
  notebook: string;
  topic: string;
  href: string;
  quote: string;
};

const VECTOR_HIT_LIMIT = 24;
const MIN_VECTOR_SCORE = 0.22;
const MAX_EXCERPTS = 8;
const KEYWORD_BLEND = 6;
const MAX_PER_PAGE = 2;

async function keywordExcerpts(
  userId: string,
  query: string,
  pageIds?: string[] | null
): Promise<Excerpt[]> {
  if (pageIds && pageIds.length === 0) return [];

  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((t) => t.length > 2)
    .slice(0, 8);
  const needle = query.toLowerCase();
  const pages = await prisma.userTopic.findMany({
    where: {
      userId,
      status: "PUBLISHED",
      ...(pageIds ? { id: { in: pageIds } } : {}),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      contentUrl: true,
      contentType: true,
      sourceUrl: true,
      userSubject: { select: { name: true, slug: true } },
      userTopicGroup: { select: { title: true, slug: true } },
    },
    take: pageIds ? undefined : 400,
  });

  const scored: Excerpt[] = [];
  for (const page of pages) {
    const notebook = page.userSubject?.name ?? "Library";
    const topic = page.userTopicGroup?.title ?? "";
    const blob = `${page.title} ${topic} ${notebook}`.toLowerCase();
    let score = 0;
    if (page.title.toLowerCase().includes(needle)) score += 3;
    if (topic && topic.toLowerCase().includes(needle)) score += 2;
    if (notebook.toLowerCase().includes(needle)) score += 1;
    for (const term of terms) {
      if (page.title.toLowerCase().includes(term)) score += 1.5;
      if (topic.toLowerCase().includes(term)) score += 1;
      if (blob.includes(term)) score += 0.25;
    }
    if (score === 0 && needle.length > 4 && blob.includes(needle.slice(0, 6))) {
      score = 1;
    }
    const href = pageHref(
      page.userSubject?.slug,
      page.userTopicGroup?.slug,
      page.slug
    );
    let text = page.title;
    if (page.contentType === "LINK" && page.sourceUrl) {
      text = `${page.title} ${page.sourceUrl}`;
    } else if (page.contentType !== "PDF" && page.contentUrl) {
      try {
        const html = await getFromS3(page.contentUrl);
        text = truncateText(htmlToPlainText(html), 1800);
        const lower = text.toLowerCase();
        if (lower.includes(needle)) score += 2;
        for (const term of terms) {
          if (lower.includes(term)) score += 0.5;
        }
      } catch (err) {
        logger.error("rag.keyword.fetch_failed", errorFields(err));
      }
    }
    if (score === 0) continue;
    scored.push({
      pageId: page.id,
      title: page.title,
      notebook,
      topic,
      href,
      text,
      score,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, MAX_EXCERPTS);
}

function hitsToExcerpts(
  hits: Awaited<ReturnType<typeof searchVectors>>
): Excerpt[] {
  const byKey = new Map<string, Excerpt>();
  for (const hit of hits) {
    if (hit.score < MIN_VECTOR_SCORE) continue;
    const p = hit.payload;
    const key = `${p.pageId}:${p.chunkIndex ?? p.text.slice(0, 40)}`;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, {
        pageId: p.pageId,
        title: p.title,
        notebook: p.notebook,
        topic: p.topic,
        href: p.href,
        text: p.text,
        score: hit.score,
      });
    } else if (hit.score > prev.score) {
      prev.score = hit.score;
      prev.text = p.text;
    }
  }
  return [...byKey.values()];
}

export async function retrieveLibrary(
  userId: string,
  query: string,
  opts?: { pageIds?: string[] | null }
): Promise<Excerpt[]> {
  const pageIds = opts?.pageIds;
  if (pageIds && pageIds.length === 0) return [];

  const keywordPromise = keywordExcerpts(userId, query, pageIds);

  if (isVectorConfigured()) {
    try {
      const [vector] = await embedTexts([query], { task: "query" });
      const hits = await searchVectors(vector, userId, VECTOR_HIT_LIMIT, {
        pageIds: pageIds ?? undefined,
      });
      const vectorExcerpts = hitsToExcerpts(hits);

      if (vectorExcerpts.length > 0) {
        const keywords = await keywordPromise;
        const fused = reciprocalRankFusion([
          vectorExcerpts,
          keywords.slice(0, KEYWORD_BLEND),
        ]);
        return diversifyExcerpts(fused, MAX_EXCERPTS, MAX_PER_PAGE);
      }
    } catch (err) {
      logger.error("rag.vector_retrieve_failed", errorFields(err));
    }
  }

  return keywordPromise;
}

/**
 * Page Ask retrieval: prefer chunks from this page, then optional related notes.
 * Free-tier default skips cross-library search (relatedLimit=0) to avoid an extra
 * Qdrant round-trip; set includeRelated for richer answers.
 */
export async function retrievePageAskContext(
  userId: string,
  pageId: string,
  query: string,
  opts?: { hasSelection?: boolean; includeRelated?: boolean }
): Promise<{ pageChunks: string[]; relatedExcerpts: Excerpt[] }> {
  if (!query.trim()) {
    return { pageChunks: [], relatedExcerpts: [] };
  }

  const hasSelection = Boolean(opts?.hasSelection);
  const includeRelated = Boolean(opts?.includeRelated);
  const pageHitLimit = hasSelection ? 6 : 8;
  const relatedLimit = includeRelated ? (hasSelection ? 1 : 2) : 0;

  if (!isVectorConfigured()) {
    const keywords = await keywordExcerpts(userId, query);
    return {
      pageChunks: keywords
        .filter((e) => e.pageId === pageId)
        .flatMap((e) => e.text.split(/\n{2,}/))
        .filter(Boolean)
        .slice(0, pageHitLimit),
      relatedExcerpts: relatedLimit
        ? keywords.filter((e) => e.pageId !== pageId).slice(0, relatedLimit)
        : [],
    };
  }

  try {
    const [vector] = await embedTexts([query], { task: "query" });
    const pageHits = await searchVectors(vector, userId, pageHitLimit, {
      pageId,
    });

    const scoreFloor = MIN_VECTOR_SCORE * (hasSelection ? 0.75 : 0.85);
    const pageChunks = pageHits
      .filter((h) => h.score >= scoreFloor)
      .sort((a, b) => b.score - a.score)
      .map((h) => h.payload.text)
      .filter(Boolean);

    let relatedExcerpts: Excerpt[] = [];
    if (relatedLimit > 0) {
      const libraryHits = await searchVectors(vector, userId, 12);
      relatedExcerpts = diversifyExcerpts(
        hitsToExcerpts(libraryHits).filter((e) => e.pageId !== pageId),
        relatedLimit,
        1
      );
    }

    return { pageChunks, relatedExcerpts };
  } catch (err) {
    logger.error("rag.page_ask_retrieve_failed", errorFields(err));
    return { pageChunks: [], relatedExcerpts: [] };
  }
}
