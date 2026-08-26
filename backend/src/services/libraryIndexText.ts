import { getFromS3 } from "./s3.js";
import { htmlToPlainText } from "../utils/htmlText.js";
import { logger, errorFields } from "../utils/logger.js";
import { contentKeyFromPdfKey } from "../utils/docPaths.js";
import { isThinPageText } from "../utils/pageAskContext.js";

/** Bump when extract/assemble logic changes so the worker refreshes old rows. */
export const INDEX_CONTENT_VERSION = "v3";

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

async function loadS3Text(key: string): Promise<string> {
  try {
    const raw = await getFromS3(key);
    if (!raw) return "";
    const trimmed = raw.trim();
    if (!trimmed) return "";
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
    const text = await loadS3Text(key);
    if (text) return text;
  }

  return page.title;
}
