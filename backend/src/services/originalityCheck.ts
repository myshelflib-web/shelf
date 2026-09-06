import prisma from "../utils/prisma.js";
import { truncateText } from "../utils/htmlText.js";
import { isPremiumUser } from "../utils/paywall.js";
import { getWebOriginalityProvider } from "./webOriginalityProvider.js";
import { retrieveLibrary, type Excerpt } from "./ragRetrieve.js";
import { isVectorConfigured } from "./vectorStore.js";

export type OriginalityMatch = {
  pageId: string;
  title: string;
  notebook: string;
  topic: string;
  href: string;
  quote: string;
  score: number;
  severity: "high" | "medium" | "low";
};

export type SyllabusOverlap = {
  docId: string;
  title: string;
  source: string;
  excerpt: string;
  score: number;
};

export type LibraryOriginalityResult = {
  kind: "library";
  matches: OriginalityMatch[];
  indexed: boolean;
  note: string;
};

export type SyllabusOriginalityResult = {
  kind: "syllabus";
  overlaps: SyllabusOverlap[];
  note: string;
};

export type WebOriginalityResult = {
  kind: "web";
  status: "premium_required" | "coming_soon";
  message: string;
  upgradeUrl?: string;
};

const HIGH = 0.72;
const MEDIUM = 0.55;
/** Soft floor — below this we do not surface as a reuse signal. */
const FLOOR = 0.42;

function severityFor(score: number): "high" | "medium" | "low" {
  if (score >= HIGH) return "high";
  if (score >= MEDIUM) return "medium";
  return "low";
}

function significantTerms(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((t) => t.length > 3)
    .slice(0, 48);
}

/** Cheap overlap score for syllabus / relevancy body chunks (0–1). */
export function termOverlapScore(a: string, b: string): number {
  const ta = new Set(significantTerms(a));
  const tb = significantTerms(b);
  if (ta.size === 0 || tb.length === 0) return 0;
  let hit = 0;
  for (const t of tb) {
    if (ta.has(t)) hit += 1;
  }
  return Math.min(1, hit / Math.max(8, Math.min(ta.size, 24)));
}

function chunkText(body: string, size = 500): string[] {
  const clean = body.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const out: string[] = [];
  for (let i = 0; i < clean.length && out.length < 24; i += size) {
    out.push(clean.slice(i, i + size));
  }
  return out;
}

export async function checkLibraryOverlap(
  userId: string,
  text: string,
  opts?: { excludePageId?: string | null; pageIds?: string[] | null }
): Promise<LibraryOriginalityResult> {
  const query = text.trim().slice(0, 6_000);
  if (query.length < 24) {
    return {
      kind: "library",
      matches: [],
      indexed: isVectorConfigured(),
      note: "Select at least a short paragraph to check against your library.",
    };
  }

  const excerpts = await retrieveLibrary(userId, query, {
    pageIds: opts?.pageIds,
  });
  const exclude = opts?.excludePageId ?? null;
  const matches: OriginalityMatch[] = excerpts
    .filter((e) => !exclude || e.pageId !== exclude)
    .filter((e) => e.score >= FLOOR)
    .slice(0, 8)
    .map((e) => toMatch(e));

  return {
    kind: "library",
    matches,
    indexed: isVectorConfigured(),
    note:
      matches.length === 0
        ? "No close overlaps found in your Shelf library (self-check only — not a web plagiarism scan)."
        : "Close matches in your library may mean reused notes. This is not a web plagiarism check.",
  };
}

function toMatch(e: Excerpt): OriginalityMatch {
  return {
    pageId: e.pageId,
    title: e.title,
    notebook: e.notebook,
    topic: e.topic,
    href: e.href,
    quote: truncateText(e.text.replace(/\s+/g, " ").trim(), 280),
    score: Math.round(e.score * 1000) / 1000,
    severity: severityFor(e.score),
  };
}

export async function checkSyllabusOverlap(
  userId: string,
  text: string
): Promise<SyllabusOriginalityResult> {
  const query = text.trim().slice(0, 6_000);
  if (query.length < 24) {
    return {
      kind: "syllabus",
      overlaps: [],
      note: "Select at least a short paragraph to compare with syllabus docs.",
    };
  }

  const docs = await prisma.studyRelevancyDoc.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: { id: true, title: true, source: true, body: true },
  });

  if (docs.length === 0) {
    return {
      kind: "syllabus",
      overlaps: [],
      note: "No syllabus / relevancy docs saved. Attach one in Study AI sources to enable this check.",
    };
  }

  const overlaps: SyllabusOverlap[] = [];
  for (const doc of docs) {
    let best = 0;
    let bestChunk = "";
    for (const chunk of chunkText(doc.body)) {
      const score = termOverlapScore(query, chunk);
      if (score > best) {
        best = score;
        bestChunk = chunk;
      }
    }
    if (best >= 0.28) {
      overlaps.push({
        docId: doc.id,
        title: doc.title,
        source: doc.source,
        excerpt: truncateText(bestChunk, 280),
        score: Math.round(best * 1000) / 1000,
      });
    }
  }

  overlaps.sort((a, b) => b.score - a.score);

  return {
    kind: "syllabus",
    overlaps: overlaps.slice(0, 8),
    note:
      overlaps.length === 0
        ? "No strong overlap with your saved syllabus / relevancy docs."
        : "Overlap with syllabus wording can be fine when quoting headings — cite sources in your own words.",
  };
}

export async function webOriginalityStub(
  userId: string
): Promise<WebOriginalityResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, role: true, subscriptionExpiresAt: true },
  });
  if (!user || !isPremiumUser(user)) {
    return {
      kind: "web",
      status: "premium_required",
      message:
        "Web originality scanning is a Premium feature (vendor API not connected yet).",
      upgradeUrl: "/settings",
    };
  }
  const provider = getWebOriginalityProvider();
  const result = await provider.scan(userId, "");
  return {
    kind: "web",
    status: "coming_soon",
    message: result.message,
    upgradeUrl: result.upgradeUrl,
  };
}

export type AiWritingHeuristic = {
  kind: "ai_heuristic";
  likelihood: "low" | "medium" | "high" | "unknown";
  score: number;
  summary: string;
  signals: string[];
  disclaimer: string;
};

export type OriginalityReport = {
  library: LibraryOriginalityResult;
  syllabus: SyllabusOriginalityResult;
  web: WebOriginalityResult;
  aiHeuristic?: AiWritingHeuristic;
};
