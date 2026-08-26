import prisma from "../utils/prisma.js";
import { pageHref } from "../utils/docPaths.js";
import { htmlToPlainText, truncateText } from "../utils/htmlText.js";
import { parsePublicHttpUrl } from "../utils/publicUrl.js";
import { fetchWithTimeout } from "../utils/timeout.js";
import type { StudyToolContext, StudyToolResult } from "./studyTools.js";

const UA = "ShelfStudyAI/1.0 (study-ai; https://github.com/shelf)";
const FETCH_HOPS = 4;

function pageScope(ctx: StudyToolContext): { id?: { in: string[] } } {
  return ctx.pageIds ? { id: { in: ctx.pageIds } } : {};
}

function pageLabel(row: {
  title: string;
  slug: string;
  userSubject?: { name: string; slug: string } | null;
  userTopicGroup?: { title: string; slug: string } | null;
}): string {
  const href = pageHref(
    row.userSubject?.slug,
    row.userTopicGroup?.slug,
    row.slug
  );
  const where = [row.userSubject?.name, row.userTopicGroup?.title]
    .filter(Boolean)
    .join(" / ");
  return `${row.title}${where ? ` (${where})` : ""} → ${href}`;
}

export async function lookupHighlights(
  ctx: StudyToolContext,
  args: Record<string, unknown>
): Promise<StudyToolResult> {
  const query = String(args.query ?? "").trim();
  const rows = await prisma.userContentHighlight.findMany({
    where: {
      userId: ctx.userId,
      ...(ctx.pageIds ? { userTopicId: { in: ctx.pageIds } } : {}),
      ...(query
        ? {
            OR: [
              { text: { contains: query, mode: "insensitive" } },
              { note: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      text: true,
      note: true,
      color: true,
      pageNumber: true,
      userTopic: {
        select: {
          title: true,
          slug: true,
          userSubject: { select: { name: true, slug: true } },
          userTopicGroup: { select: { title: true, slug: true } },
        },
      },
    },
  });
  if (rows.length === 0) {
    return { text: "No matching highlights in this library scope." };
  }
  const lines = rows.map((h) => {
    const page = pageLabel(h.userTopic);
    const quote = truncateText(h.text.replace(/\s+/g, " ").trim(), 280);
    const note = h.note?.trim()
      ? ` Note: ${truncateText(h.note.trim(), 160)}`
      : "";
    const loc = h.pageNumber ? ` p.${h.pageNumber}` : "";
    return `- "${quote}"${loc} — ${page}${note}`;
  });
  return { text: truncateText(lines.join("\n"), 3_200) };
}

export async function lookupRecentPages(
  ctx: StudyToolContext
): Promise<StudyToolResult> {
  const rows = await prisma.userTopic.findMany({
    where: {
      userId: ctx.userId,
      status: "PUBLISHED",
      ...pageScope(ctx),
    },
    orderBy: [{ viewedAt: "desc" }, { updatedAt: "desc" }],
    take: 12,
    select: {
      title: true,
      slug: true,
      viewedAt: true,
      updatedAt: true,
      userSubject: { select: { name: true, slug: true } },
      userTopicGroup: { select: { title: true, slug: true } },
    },
  });
  if (rows.length === 0) {
    return { text: "No recent pages in this library scope." };
  }
  const lines = rows.map((p) => {
    const when = (p.viewedAt ?? p.updatedAt).toISOString().slice(0, 10);
    return `- ${pageLabel(p)} (${when})`;
  });
  return { text: lines.join("\n") };
}

export async function lookupStarred(
  ctx: StudyToolContext
): Promise<StudyToolResult> {
  const rows = await prisma.userTopic.findMany({
    where: {
      userId: ctx.userId,
      status: "PUBLISHED",
      starred: true,
      ...pageScope(ctx),
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      title: true,
      slug: true,
      userSubject: { select: { name: true, slug: true } },
      userTopicGroup: { select: { title: true, slug: true } },
    },
  });
  if (rows.length === 0) {
    return { text: "No starred pages in this library scope." };
  }
  return { text: rows.map((p) => `- ${pageLabel(p)}`).join("\n") };
}

export async function lookupCollection(
  ctx: StudyToolContext,
  args: Record<string, unknown>
): Promise<StudyToolResult> {
  const name = String(args.name ?? args.query ?? "").trim();
  if (!name) return { text: "lookup_collection needs a collection name." };
  const notebook = await prisma.userSubject.findFirst({
    where: {
      userId: ctx.userId,
      name: { contains: name, mode: "insensitive" },
    },
    select: {
      name: true,
      slug: true,
      topicGroups: {
        orderBy: { order: "asc" },
        take: 12,
        select: {
          title: true,
          pages: {
            where: {
              status: "PUBLISHED",
              ...(ctx.pageIds ? { id: { in: ctx.pageIds } } : {}),
            },
            orderBy: { order: "asc" },
            take: 8,
            select: { title: true },
          },
        },
      },
      topics: {
        where: {
          userTopicGroupId: null,
          status: "PUBLISHED",
          ...(ctx.pageIds ? { id: { in: ctx.pageIds } } : {}),
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: { title: true },
      },
    },
  });
  if (!notebook) {
    return { text: `No collection matching "${name}".` };
  }
  const topicBits = notebook.topicGroups.map((g) => {
    const pages = g.pages.map((p) => p.title).join(", ");
    return pages ? `${g.title} [${pages}]` : g.title;
  });
  const loose = notebook.topics.map((p) => p.title);
  const body = [notebook.name, ...topicBits, ...loose]
    .filter(Boolean)
    .join("\n");
  return { text: truncateText(body, 3_000) };
}

export async function lookupRelevancy(
  ctx: StudyToolContext,
  args: Record<string, unknown>
): Promise<StudyToolResult> {
  const query = String(args.query ?? "").trim();
  const rows = await prisma.studyRelevancyDoc.findMany({
    where: {
      userId: ctx.userId,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { body: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 6,
    select: { title: true, body: true, source: true, updatedAt: true },
  });
  if (rows.length === 0) {
    return { text: "No syllabus / relevancy docs saved." };
  }
  const lines = rows.map((d) => {
    const excerpt = truncateText(d.body.replace(/\s+/g, " ").trim(), 500);
    return `## ${d.title} (${d.source})\n${excerpt}`;
  });
  return { text: truncateText(lines.join("\n\n"), 3_200) };
}

async function fetchPublicOnce(url: string): Promise<Response> {
  let current = url;
  for (let hop = 0; hop < FETCH_HOPS; hop++) {
    const res = await fetchWithTimeout(current, {
      timeoutMs: 8_000,
      redirect: "manual",
      headers: {
        "User-Agent": UA,
        Accept: "text/html, text/plain;q=0.9, */*;q=0.1",
      },
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return res;
      const next = parsePublicHttpUrl(new URL(loc, current).toString());
      if (!next) {
        throw new Error("Redirected to a blocked host.");
      }
      current = next;
      continue;
    }
    return res;
  }
  throw new Error("Too many redirects.");
}

export async function fetchPublicUrl(
  args: Record<string, unknown>
): Promise<StudyToolResult> {
  const parsed = parsePublicHttpUrl(String(args.url ?? ""));
  if (!parsed) {
    return { text: "fetch_url needs a public http(s) URL." };
  }
  try {
    const res = await fetchPublicOnce(parsed);
    if (!res.ok) {
      return { text: `Could not fetch that URL (${res.status}).` };
    }
    const ctype = (res.headers.get("content-type") ?? "").toLowerCase();
    if (
      ctype &&
      !ctype.includes("text/html") &&
      !ctype.includes("text/plain") &&
      !ctype.includes("application/xhtml") &&
      !ctype.includes("json")
    ) {
      return { text: `URL is not readable text (${ctype || "unknown type"}).` };
    }
    const raw = await res.text();
    const plain = htmlToPlainText(raw.slice(0, 80_000));
    if (!plain) return { text: "That URL had no readable text." };
    return { text: truncateText(plain, 2_800) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "fetch failed";
    return { text: `Could not fetch that URL (${msg}).` };
  }
}

export function currentTimeLookup(): StudyToolResult {
  const now = new Date();
  const weekday = now.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });
  return {
    text: `UTC now: ${now.toISOString()} (${weekday}). Use this to interpret relative planner dates.`,
  };
}
