import { StudyGoal } from "@prisma/client";
import prisma from "../utils/prisma.js";
import { pageHref } from "../utils/docPaths.js";
import { getFromS3 } from "./s3.js";
import { htmlToPlainText, truncateText } from "../utils/htmlText.js";
import { logger, errorFields } from "../utils/logger.js";
import {
  completeChat,
  streamChat,
  type ChatContentPart,
  type ChatMessage,
} from "./llm.js";
import { embedTexts } from "./embeddings.js";
import { isVectorConfigured, searchVectors } from "./vectorStore.js";
import { studySystemPrompt } from "./goalPrompt.js";

export type LibraryCitation = {
  n: number;
  pageId: string;
  title: string;
  notebook: string;
  topic: string;
  href: string;
  quote: string;
};

export type RagResult = {
  answer: string;
  citations: LibraryCitation[];
  matchCount: number;
  tokens: number;
};

type Excerpt = {
  pageId: string;
  title: string;
  notebook: string;
  topic: string;
  href: string;
  text: string;
  score: number;
};

const VECTOR_HIT_LIMIT = 16;
const MIN_VECTOR_SCORE = 0.28;
const MAX_EXCERPTS = 8;
const KEYWORD_BLEND = 4;

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

function mergeExcerpts(primary: Excerpt[], secondary: Excerpt[]): Excerpt[] {
  const byPage = new Map<string, Excerpt>();
  for (const ex of [...primary, ...secondary]) {
    const prev = byPage.get(ex.pageId);
    if (!prev) {
      byPage.set(ex.pageId, { ...ex });
      continue;
    }
    prev.score = Math.max(prev.score, ex.score) + 0.15;
    prev.text = truncateText(`${prev.text}\n${ex.text}`, 2400);
  }
  return [...byPage.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_EXCERPTS);
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
      const [vector] = await embedTexts([query]);
      const hits = await searchVectors(vector, userId, VECTOR_HIT_LIMIT, {
        pageIds: pageIds ?? undefined,
      });
      const vectorExcerpts: Excerpt[] = [];
      const byPage = new Map<string, Excerpt>();
      for (const hit of hits) {
        if (hit.score < MIN_VECTOR_SCORE) continue;
        const p = hit.payload;
        const prev = byPage.get(p.pageId);
        if (!prev) {
          byPage.set(p.pageId, {
            pageId: p.pageId,
            title: p.title,
            notebook: p.notebook,
            topic: p.topic,
            href: p.href,
            text: p.text,
            score: hit.score,
          });
        } else {
          prev.score = Math.max(prev.score, hit.score);
          prev.text = truncateText(`${prev.text}\n${p.text}`, 2400);
        }
      }
      vectorExcerpts.push(...byPage.values());

      if (vectorExcerpts.length > 0) {
        const keywords = await keywordPromise;
        return mergeExcerpts(
          vectorExcerpts,
          keywords.slice(0, KEYWORD_BLEND)
        );
      }
    } catch (err) {
      logger.error("rag.vector_retrieve_failed", errorFields(err));
    }
  }

  return keywordPromise;
}

function hitsToExcerpts(hits: Awaited<ReturnType<typeof searchVectors>>): Excerpt[] {
  const byPage = new Map<string, Excerpt>();
  for (const hit of hits) {
    if (hit.score < MIN_VECTOR_SCORE) continue;
    const p = hit.payload;
    const prev = byPage.get(p.pageId);
    if (!prev) {
      byPage.set(p.pageId, {
        pageId: p.pageId,
        title: p.title,
        notebook: p.notebook,
        topic: p.topic,
        href: p.href,
        text: p.text,
        score: hit.score,
      });
    } else {
      prev.score = Math.max(prev.score, hit.score);
      prev.text = truncateText(`${prev.text}\n${p.text}`, 3200);
    }
  }
  return [...byPage.values()];
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
  const pageHitLimit = hasSelection ? 4 : 6;
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
    const [vector] = await embedTexts([query]);
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
      const libraryHits = await searchVectors(vector, userId, 8);
      relatedExcerpts = hitsToExcerpts(libraryHits)
        .filter((e) => e.pageId !== pageId)
        .slice(0, relatedLimit);
    }

    return { pageChunks, relatedExcerpts };
  } catch (err) {
    logger.error("rag.page_ask_retrieve_failed", errorFields(err));
    return { pageChunks: [], relatedExcerpts: [] };
  }
}

export type RagHistoryMessage = {
  role: "user" | "assistant";
  content: string;
  imageBase64?: string;
};

type RagAskOpts = {
  userId: string;
  query: string;
  studyGoal: StudyGoal;
  history?: RagHistoryMessage[];
  imageBase64?: string;
  historyLimit?: number;
  /** null = whole library; [] = scoped but empty */
  pageIds?: string[] | null;
  scopeLabel?: string | null;
  syllabusText?: string | null;
};

type PreparedRag = {
  messages: ChatMessage[];
  citations: LibraryCitation[];
  matchCount: number;
};

async function prepareRagAsk(opts: RagAskOpts): Promise<PreparedRag> {
  const excerpts = await retrieveLibrary(opts.userId, opts.query, {
    pageIds: opts.pageIds,
  });
  const citations: LibraryCitation[] = excerpts.map((ex, i) => ({
    n: i + 1,
    pageId: ex.pageId,
    title: ex.title,
    notebook: ex.notebook,
    topic: ex.topic,
    href: ex.href,
    quote: truncateText(ex.text, 280),
  }));

  const numbered = excerpts
    .map(
      (ex, i) =>
        `[${i + 1}] ${ex.title} — ${ex.notebook} / ${ex.topic} (relevance ${ex.score.toFixed(2)})\n${truncateText(ex.text, 1800)}`
    )
    .join("\n\n");

  const system = studySystemPrompt(opts.studyGoal, {
    syllabusText: opts.syllabusText,
    scopeLabel: opts.scopeLabel,
  });
  const userPrompt =
    excerpts.length === 0
      ? `The library search returned no excerpts.\nQuestion: ${opts.query}`
      : `Question: ${opts.query}\n\nLibrary excerpts:\n${numbered}`;

  const historyLimit = opts.historyLimit ?? 16;
  const historyMsgs: ChatMessage[] = (opts.history ?? [])
    .slice(-historyLimit)
    .map((m) => {
      if (m.role === "user" && m.imageBase64?.startsWith("data:image/")) {
        const parts: ChatContentPart[] = [
          { type: "text", text: m.content },
          { type: "image_url", image_url: { url: m.imageBase64 } },
        ];
        return { role: "user" as const, content: parts };
      }
      return { role: m.role, content: m.content };
    });

  const latestParts: ChatContentPart[] = [{ type: "text", text: userPrompt }];
  if (opts.imageBase64?.startsWith("data:image/")) {
    latestParts.push({
      type: "image_url",
      image_url: { url: opts.imageBase64 },
    });
  }

  return {
    messages: [
      { role: "system", content: system },
      ...historyMsgs,
      {
        role: "user",
        content: latestParts.length > 1 ? latestParts : userPrompt,
      },
    ],
    citations,
    matchCount: excerpts.length,
  };
}

export async function answerWithRag(opts: RagAskOpts): Promise<RagResult> {
  const prepared = await prepareRagAsk(opts);
  const { text, tokens } = await completeChat(prepared.messages);
  return {
    answer: text,
    citations: prepared.citations,
    matchCount: prepared.matchCount,
    tokens,
  };
}

export type RagStreamEvent =
  | { type: "status"; stage: string; detail: string; citations?: LibraryCitation[] }
  | { type: "delta"; text: string }
  | {
      type: "done";
      answer: string;
      citations: LibraryCitation[];
      matchCount: number;
      tokens: number;
      model: string;
    };

/** Status stages + token deltas for library chat (same retrieval as `answerWithRag`). */
export async function* streamAnswerWithRag(
  opts: RagAskOpts
): AsyncGenerator<RagStreamEvent> {
  const searchDetail = opts.scopeLabel?.trim()
    ? `Searching in ${opts.scopeLabel.trim()}…`
    : "Searching your collections…";
  yield { type: "status", stage: "searching", detail: searchDetail };
  const prepared = await prepareRagAsk(opts);
  const scopeHint = opts.scopeLabel?.trim();
  yield {
    type: "status",
    stage: "retrieved",
    detail:
      prepared.matchCount > 0
        ? `Found ${prepared.matchCount} page${prepared.matchCount === 1 ? "" : "s"}${scopeHint ? ` in ${scopeHint}` : " in your library"}`
        : scopeHint
          ? `No matching pages in ${scopeHint}`
          : "No matching pages — answering from your study goal",
    citations: prepared.citations,
  };
  yield { type: "status", stage: "generating", detail: "Writing answer…" };

  let answer = "";
  let tokens = 0;
  let model = "";
  for await (const ev of streamChat(prepared.messages)) {
    if (ev.type === "delta") {
      answer += ev.text;
      yield { type: "delta", text: ev.text };
    } else {
      tokens = ev.tokens;
      model = ev.model;
    }
  }

  yield {
    type: "done",
    answer,
    citations: prepared.citations,
    matchCount: prepared.matchCount,
    tokens,
    model,
  };
}
