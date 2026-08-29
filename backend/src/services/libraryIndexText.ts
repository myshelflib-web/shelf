import { getFromS3 } from "./s3.js";
import { htmlToPlainText } from "../utils/htmlText.js";
import { logger, errorFields } from "../utils/logger.js";
import { contentKeyFromPdfKey } from "../utils/docPaths.js";
import { isThinPageText } from "../utils/pageAskContext.js";
import { extractPdfTextByRanges } from "./libraryIndexPdf.js";

/** Bump when extract/assemble logic changes so the worker refreshes old rows. */
export const INDEX_CONTENT_VERSION = "v5";

/** Written before embed so an OOM skip-loop does not retry the same page. */
export const INDEX_LEASE_PREFIX = `${INDEX_CONTENT_VERSION}:lease:`;

export function isIndexLeaseHash(hash: string): boolean {
  return hash.startsWith(INDEX_LEASE_PREFIX);
}

export function isFreshIndexLease(
  updatedAt: Date,
  now = Date.now(),
  ttlMs = 15 * 60 * 1000
): boolean {
  return now - updatedAt.getTime() < ttlMs;
}

export type IndexHighlight = { text: string; note: string | null };

export function assembleIndexText(opts: {
  title: string;
  contentType: string;
  notebook: string;
  topic: string;
  sourceUrl?: string | null;
  fileText: string;
  highlights?: IndexHighlight[];
}): string {
  const title = opts.title.trim() || "Untitled";
  const file = opts.fileText.replace(/\s+/g, " ").trim();
  const body =
    file && !isThinPageText(title, file) ? file : file && file !== title ? file : "";

  const highlightParts = (opts.highlights ?? [])
    .map((h) => {
      const quote = h.text.replace(/\s+/g, " ").trim();
      const note = h.note?.replace(/\s+/g, " ").trim();
      if (!quote && !note) return "";
      if (quote && note) return `Highlight: ${quote}\nNote: ${note}`;
      return quote ? `Highlight: ${quote}` : `Note: ${note}`;
    })
    .filter(Boolean);

  const lines = [
    `Type: ${opts.contentType}`,
    `Title: ${title}`,
    opts.notebook ? `Collection: ${opts.notebook}` : "",
    opts.topic ? `Topic: ${opts.topic}` : "",
    opts.sourceUrl ? `Link: ${opts.sourceUrl}` : "",
    body ? `Content:\n${body}` : "",
    highlightParts.length ? highlightParts.join("\n") : "",
  ].filter(Boolean);

  return lines.join("\n");
}

export function isIndexableTextKey(key: string): boolean {
  return Boolean(key) && !/\.pdf$/i.test(key);
}

async function loadS3Text(key: string): Promise<string> {
  if (!isIndexableTextKey(key)) return "";
  try {
    const raw = await getFromS3(key);
    if (!raw) return "";
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("%PDF")) return "";
    if (
      trimmed.startsWith("<") ||
      /<\/?[a-z][\s\S]*>/i.test(trimmed.slice(0, 400))
    ) {
      return htmlToPlainText(raw);
    }
    return trimmed;
  } catch (err) {
    logger.debug("library_index.fetch_miss", { key, ...errorFields(err) });
    return "";
  }
}

/** Plain text for indexing / Study AI from every supported page format. */
export async function extractPageBody(page: {
  title: string;
  contentType: string;
  contentUrl: string | null;
  sourceUrl: string | null;
  pdfKey: string | null;
}): Promise<string> {
  if (page.contentType === "LINK" && page.sourceUrl) {
    const snap = page.contentUrl ? await loadS3Text(page.contentUrl) : "";
    return [page.title, page.sourceUrl, snap].filter(Boolean).join("\n");
  }

  const keys: string[] = [];
  if (page.contentUrl && !/^https?:\/\//i.test(page.contentUrl)) {
    keys.push(page.contentUrl);
  }
  if (page.pdfKey) {
    const derived = contentKeyFromPdfKey(page.pdfKey);
    if (!keys.includes(derived)) keys.push(derived);
  }

  for (const key of keys) {
    if (!isIndexableTextKey(key)) continue;
    const text = await loadS3Text(key);
    if (text && !isThinPageText(page.title, text)) return text;
    if (text && text !== page.title) return text;
  }

  if (page.pdfKey && (page.contentType === "PDF" || page.pdfKey.endsWith(".pdf"))) {
    const fromPdf = await extractPdfTextByRanges(page.pdfKey);
    if (fromPdf) return fromPdf;
  }

  return page.title;
}
