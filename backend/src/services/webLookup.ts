import { StudyGoal } from "@prisma/client";
import { fetchWithRetry } from "../utils/fetchRetry.js";
import { logger, errorFields } from "../utils/logger.js";
import {
  formatWebHits,
  geminiGoogleSearchText,
  googleCustomSearchHits,
  type WebHit,
} from "./googleWebSearch.js";
import {
  siteRestrictClause,
  webSourceProfile,
  type WebSourceScope,
} from "./webSourceProfiles.js";

const UA = "ShelfStudyAI/1.0 (study-ai; https://github.com/shelf)";

export type WebLookupOpts = {
  timeoutMs?: number;
  studyGoal?: StudyGoal | null;
  sourceScope?: WebSourceScope;
};

async function wikipediaHits(query: string, timeoutMs = 8_000): Promise<WebHit[]> {
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
    timeoutMs,
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

async function duckDuckGoHits(query: string, timeoutMs = 8_000): Promise<WebHit[]> {
  const url =
    "https://api.duckduckgo.com/?" +
    new URLSearchParams({
      q: query,
      format: "json",
      no_html: "1",
      skip_disambig: "1",
    }).toString();
  const res = await fetchWithRetry(url, {
    timeoutMs,
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

function dedupeHits(hits: WebHit[]): WebHit[] {
  const seen = new Set<string>();
  const out: WebHit[] = [];
  for (const h of hits) {
    const key = (h.url || h.title).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(h);
  }
  return out;
}

async function openWebHits(
  query: string,
  domains: readonly string[],
  timeoutMs: number
): Promise<WebHit[]> {
  const site = siteRestrictClause(domains, 5);
  if (site) {
    const restricted = await googleCustomSearchHits(query, {
      siteRestrict: site,
    });
    if (restricted.length) return restricted;
  }
  const broad = await googleCustomSearchHits(query);
  if (broad.length) {
    if (domains.length === 0) return broad;
    const allowed = new Set(domains.map((d) => d.toLowerCase()));
    const filtered = broad.filter((h) => {
      try {
        const host = new URL(h.url).hostname.replace(/^www\./, "");
        return [...allowed].some((d) => host === d || host.endsWith(`.${d}`));
      } catch {
        return false;
      }
    });
    if (filtered.length) return filtered;
  }
  const siteHint = domains.slice(0, 8).join(", ");
  const grounded = await geminiGoogleSearchText(query, { siteHint });
  if (grounded) {
    return [{ title: "Web summary", url: "", snippet: grounded }];
  }
  const [wiki, ddg] = await Promise.allSettled([
    wikipediaHits(query, timeoutMs),
    duckDuckGoHits(query, timeoutMs),
  ]);
  return [
    ...(wiki.status === "fulfilled" ? wiki.value : []),
    ...(ddg.status === "fulfilled" ? ddg.value : []),
  ];
}

async function collectHits(
  query: string,
  scope: WebSourceScope,
  profile: ReturnType<typeof webSourceProfile>,
  timeoutMs: number
): Promise<{ track: WebHit[]; general: WebHit[] }> {
  const tasks: Promise<{ kind: "track" | "general"; hits: WebHit[] }>[] = [];

  if (scope === "all" || scope === "track") {
    tasks.push(
      openWebHits(query, profile.preferredDomains, timeoutMs).then((hits) => ({
        kind: "track" as const,
        hits,
      }))
    );
  }
  if (scope === "all" || scope === "general") {
    tasks.push(
      openWebHits(query, profile.generalDomains, timeoutMs).then((hits) => ({
        kind: "general" as const,
        hits,
      }))
    );
  }

  const settled = await Promise.allSettled(tasks);
  let track: WebHit[] = [];
  let general: WebHit[] = [];
  for (const row of settled) {
    if (row.status !== "fulfilled") continue;
    if (row.value.kind === "track") track = row.value.hits;
    else general = row.value.hits;
  }
  return { track, general };
}

function formatScopedHits(
  track: WebHit[],
  general: WebHit[],
  scope: WebSourceScope,
  profileLabel: string
): string {
  const parts: string[] = [];
  if (scope !== "general" && track.length) {
    parts.push(
      `${profileLabel} sources:\n${formatWebHits(track.slice(0, 4))}`
    );
  }
  if (scope !== "track" && general.length) {
    parts.push(
      `General web (Medium, Quora, etc.):\n${formatWebHits(general.slice(0, 4))}`
    );
  }
  if (parts.length === 0) {
    const merged = dedupeHits([...track, ...general]).slice(0, 4);
    if (merged.length === 0) {
      return "No public web results. Answer from the library or say you are unsure.";
    }
    return formatWebHits(merged);
  }
  return parts.join("\n\n");
}

export async function webLookup(
  query: string,
  opts?: WebLookupOpts
): Promise<string> {
  const q = query.trim().slice(0, 200);
  if (!q) return "No search query provided.";
  const timeoutMs = opts?.timeoutMs ?? 5_000;
  const scope = opts?.sourceScope ?? "all";
  const profile = webSourceProfile(opts?.studyGoal);

  try {
    const { track, general } = await collectHits(q, scope, profile, timeoutMs);
    return formatScopedHits(track, general, scope, profile.label);
  } catch (err) {
    logger.warn("study.web_lookup_failed", errorFields(err));
    return "Web search is unavailable right now. Rely on the library excerpts.";
  }
}
