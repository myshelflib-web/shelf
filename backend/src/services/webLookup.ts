import { fetchWithRetry } from "../utils/fetchRetry.js";
import { logger, errorFields } from "../utils/logger.js";
import {
  formatWebHits,
  geminiGoogleSearchText,
  googleCustomSearchHits,
  type WebHit,
} from "./googleWebSearch.js";

const UA = "ShelfStudyAI/1.0 (study-ai; https://github.com/shelf)";

async function wikipediaHits(query: string): Promise<WebHit[]> {
  const searchUrl =
    "https://en.wikipedia.org/w/api.php?" +
    new URLSearchParams({
      action: "opensearch",
      search: query,
      limit: "3",
      namespace: "0",
      format: "json",
    }).toString();
  const res = await fetchWithRetry(searchUrl, {
    timeoutMs: 8_000,
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as [string, string[], string[], string[]];
  const titles = data[1] ?? [];
  const snippets = data[2] ?? [];
  const urls = data[3] ?? [];
  const hits: WebHit[] = [];
  for (let i = 0; i < titles.length; i++) {
    hits.push({
      title: titles[i],
      url: urls[i] ?? "",
      snippet: snippets[i] ?? "",
    });
  }
  return hits;
}

async function duckDuckGoHits(query: string): Promise<WebHit[]> {
  const url =
    "https://api.duckduckgo.com/?" +
    new URLSearchParams({
      q: query,
      format: "json",
      no_html: "1",
      skip_disambig: "1",
    }).toString();
  const res = await fetchWithRetry(url, {
    timeoutMs: 8_000,
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    Heading?: string;
    AbstractText?: string;
    AbstractURL?: string;
    RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
  };
  const hits: WebHit[] = [];
  if (data.AbstractText) {
    hits.push({
      title: data.Heading || query,
      url: data.AbstractURL || "",
      snippet: data.AbstractText,
    });
  }
  for (const rel of data.RelatedTopics ?? []) {
    if (!rel.Text || hits.length >= 3) break;
    hits.push({
      title: rel.Text.split(" - ")[0] ?? query,
      url: rel.FirstURL || "",
      snippet: rel.Text,
    });
  }
  return hits;
}

export async function webLookup(query: string): Promise<string> {
  const q = query.trim().slice(0, 200);
  if (!q) return "No search query provided.";
  try {
    const cse = await googleCustomSearchHits(q);
    if (cse.length) return formatWebHits(cse);

    const grounded = await geminiGoogleSearchText(q);
    if (grounded) return grounded;

    const [wiki, ddg] = await Promise.allSettled([
      wikipediaHits(q),
      duckDuckGoHits(q),
    ]);
    const hits: WebHit[] = [
      ...(wiki.status === "fulfilled" ? wiki.value : []),
      ...(ddg.status === "fulfilled" ? ddg.value : []),
    ].slice(0, 4);
    if (hits.length === 0) {
      return "No public web results. Answer from the library or say you are unsure.";
    }
    return formatWebHits(hits);
  } catch (err) {
    logger.warn("study.web_lookup_failed", errorFields(err));
    return "Web search is unavailable right now. Rely on the library excerpts.";
  }
}
