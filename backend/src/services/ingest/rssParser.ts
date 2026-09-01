import { parsePublicHttpUrl } from "../../utils/publicUrl.js";
import { fetchWithRetry } from "../../utils/fetchRetry.js";

const UA = "ShelfIngest/1.0 (+https://shelf.study; copyright-safe-ingest)";

export type RssEntry = {
  externalId: string;
  title: string;
  canonicalUrl: string;
  publishedAt: Date | null;
  description: string | null;
};

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function tagValue(block: string, tag: string): string | null {
  const cdata = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i");
  const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(cdata) ?? block.match(plain);
  return m?.[1]?.trim() ?? null;
}

function parseRssDate(raw: string | null): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseRssXml(xml: string): RssEntry[] {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  const entries: RssEntry[] = [];

  for (const item of items) {
    const title = stripTags(tagValue(item, "title") ?? "");
    const linkRaw = tagValue(item, "link") ?? tagValue(item, "guid") ?? "";
    const link = parsePublicHttpUrl(linkRaw) ?? linkRaw.trim();
    if (!title || !link) continue;

    const description =
      stripTags(tagValue(item, "description") ?? "") ||
      stripTags(tagValue(item, "content:encoded") ?? "") ||
      null;

    entries.push({
      externalId: tagValue(item, "guid") ?? link,
      title,
      canonicalUrl: link,
      publishedAt: parseRssDate(tagValue(item, "pubDate")),
      description,
    });
  }

  return entries;
}

export async function fetchRssFeed(feedUrl: string): Promise<RssEntry[]> {
  const safe = parsePublicHttpUrl(feedUrl);
  if (!safe) throw new Error("Feed URL is not an allowed public http(s) URL.");

  const res = await fetchWithRetry(safe, {
    timeoutMs: 20_000,
    headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml, */*" },
  });
  if (!res.ok) throw new Error(`RSS fetch failed (${res.status}).`);

  const xml = await res.text();
  return parseRssXml(xml);
}
