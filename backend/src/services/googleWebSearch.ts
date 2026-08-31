import { fetchWithRetry } from "../utils/fetchRetry.js";
import { truncateText } from "../utils/htmlText.js";
import { logger } from "../utils/logger.js";
import {
  chatModel,
  geminiNativeBaseUrl,
  isGeminiBaseUrl,
  llmApiKey,
  llmBaseUrl,
} from "./llmConfig.js";
import { acquireGeminiChatSlot } from "./geminiLimits.js";

export type WebHit = { title: string; url: string; snippet: string };

const UA = "ShelfStudyAI/1.0 (study-ai; https://github.com/shelf)";

export function googleCseConfig(): { key: string; cx: string } | null {
  const cx = (
    process.env.GOOGLE_CSE_ID ??
    process.env.GOOGLE_SEARCH_CX ??
    ""
  ).trim();
  const key = (
    process.env.GOOGLE_SEARCH_API_KEY ??
    process.env.GOOGLE_CSE_API_KEY ??
    ""
  ).trim();
  if (!cx || !key) return null;
  return { key, cx };
}

export function formatWebHits(hits: WebHit[]): string {
  return hits
    .slice(0, 5)
    .map(
      (h, i) =>
        `${i + 1}. ${h.title}${h.url ? ` (${h.url})` : ""}\n${truncateText(h.snippet || "No snippet.", 400)}`
    )
    .join("\n\n");
}

export function hitsFromCustomSearch(data: {
  items?: Array<{ title?: string; link?: string; snippet?: string }>;
}): WebHit[] {
  const hits: WebHit[] = [];
  for (const item of data.items ?? []) {
    if (!item.title && !item.snippet) continue;
    hits.push({
      title: item.title || "Result",
      url: item.link || "",
      snippet: item.snippet || "",
    });
    if (hits.length >= 5) break;
  }
  return hits;
}

export function textFromGeminiGrounding(data: {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    groundingMetadata?: {
      groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
    };
  }>;
}): string | null {
  const cand = data.candidates?.[0];
  const text = (cand?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("\n")
    .trim();
  const chunks = cand?.groundingMetadata?.groundingChunks ?? [];
  const sources: WebHit[] = [];
  for (const chunk of chunks) {
    const web = chunk.web;
    if (!web?.uri && !web?.title) continue;
    sources.push({
      title: web.title || "Source",
      url: web.uri || "",
      snippet: "",
    });
    if (sources.length >= 5) break;
  }
  if (!text && sources.length === 0) return null;
  const sourceBlock =
    sources.length === 0
      ? ""
      : `\n\nSources:\n${sources
          .map((s, i) => `${i + 1}. ${s.title}${s.url ? ` (${s.url})` : ""}`)
          .join("\n")}`;
  return `${truncateText(text || "Google Search results:", 1_800)}${sourceBlock}`;
}

/** Programmable Search Engine JSON API — does not consume Gemini chat RPM. */
export async function googleCustomSearchHits(
  query: string,
  opts?: { siteRestrict?: string }
): Promise<WebHit[]> {
  const cfg = googleCseConfig();
  if (!cfg) return [];
  const q = opts?.siteRestrict
    ? `${opts.siteRestrict} ${query}`.trim()
    : query;
  const url =
    "https://www.googleapis.com/customsearch/v1?" +
    new URLSearchParams({
      key: cfg.key,
      cx: cfg.cx,
      q: q.slice(0, 256),
      num: "5",
    }).toString();
  const res = await fetchWithRetry(url, {
    timeoutMs: 8_000,
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logger.warn("study.google_cse_failed", {
      status: res.status,
      body: body.slice(0, 200),
    });
    return [];
  }
  const data = (await res.json()) as {
    items?: Array<{ title?: string; link?: string; snippet?: string }>;
  };
  return hitsFromCustomSearch(data);
}

/**
 * Gemini native Google Search grounding (same LLM_API_KEY).
 * Uses one Flash-Lite request — paced by the chat RPM limiter.
 */
export async function geminiGoogleSearchText(
  query: string,
  opts?: { siteHint?: string }
): Promise<string | null> {
  const apiKey = llmApiKey();
  if (!apiKey || !isGeminiBaseUrl(llmBaseUrl())) return null;
  const slug = chatModel().replace(/^models\//, "");
  const path = `${geminiNativeBaseUrl()}/models/${slug}:generateContent`;
  await acquireGeminiChatSlot();
  const res = await fetchWithRetry(path, {
    method: "POST",
    timeoutMs: 20_000,
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: opts?.siteHint
                ? `Search the public web for: ${query}. Prefer these sources when relevant: ${opts.siteHint}. Cite source URLs. Be concise.`
                : `Search the public web and list the key facts for: ${query}. Cite source URLs. Be concise.`,
            },
          ],
        },
      ],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logger.warn("study.gemini_google_search_failed", {
      status: res.status,
      body: body.slice(0, 240),
    });
    return null;
  }
  const data = (await res.json()) as Parameters<
    typeof textFromGeminiGrounding
  >[0];
  return textFromGeminiGrounding(data);
}
