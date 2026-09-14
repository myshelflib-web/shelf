import { fetchWithRetry } from "../utils/fetchRetry.js";
import { truncateText } from "../utils/htmlText.js";
import type { WebHit } from "./googleWebSearch.js";

const UA = "ShelfStudyAI/1.0 (study-ai; https://github.com/shelf)";

const WEATHER_RE =
  /\b(weather|forecast|temperature|humidity|rainfall|precipitat|°\s*[cf]|celsius|fahrenheit)\b/i;
const NEWS_RE =
  /\b(news|headline|headlines|current events?|breaking|today'?s news)\b/i;

export function looksLikeWeatherQuery(query: string): boolean {
  return WEATHER_RE.test(query);
}

export function looksLikeNewsQuery(query: string): boolean {
  return NEWS_RE.test(query);
}

/** Strip weather filler words so wttr.in gets a place name. */
export function weatherPlaceFromQuery(query: string): string {
  const place = query
    .replace(WEATHER_RE, " ")
    .replace(
      /\b(what|whats|what's|is|the|like|today|tonight|now|current|in|at|for|please|tell|me|about)\b/gi,
      " "
    )
    .replace(/[?!.,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return place.slice(0, 80) || query.trim().slice(0, 80);
}

/** Live weather via wttr.in — no API key. */
export async function wttrWeatherHits(
  query: string,
  timeoutMs = 8_000
): Promise<WebHit[]> {
  if (!looksLikeWeatherQuery(query)) return [];
  const place = weatherPlaceFromQuery(query);
  if (!place) return [];
  const url = `https://wttr.in/${encodeURIComponent(place)}?format=j1`;
  const res = await fetchWithRetry(url, {
    timeoutMs,
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    current_condition?: Array<{
      temp_C?: string;
      temp_F?: string;
      humidity?: string;
      weatherDesc?: Array<{ value?: string }>;
      windspeedKmph?: string;
      FeelsLikeC?: string;
    }>;
    nearest_area?: Array<{
      areaName?: Array<{ value?: string }>;
      country?: Array<{ value?: string }>;
    }>;
    weather?: Array<{
      date?: string;
      maxtempC?: string;
      mintempC?: string;
      hourly?: Array<{ chanceofrain?: string; weatherDesc?: Array<{ value?: string }> }>;
    }>;
  };
  const cur = data.current_condition?.[0];
  if (!cur) return [];
  const area = data.nearest_area?.[0];
  const placeName =
    area?.areaName?.[0]?.value ||
    place;
  const country = area?.country?.[0]?.value;
  const desc = cur.weatherDesc?.[0]?.value || "Conditions unavailable";
  const today = data.weather?.[0];
  const rainChance = today?.hourly?.[0]?.chanceofrain;
  const lines = [
    `${placeName}${country ? `, ${country}` : ""}: ${desc}.`,
    `Now ${cur.temp_C ?? "?"}°C (feels ${cur.FeelsLikeC ?? "?"}°C), humidity ${cur.humidity ?? "?"}%, wind ${cur.windspeedKmph ?? "?"} km/h.`,
  ];
  if (today?.maxtempC || today?.mintempC) {
    lines.push(
      `Today high ${today.maxtempC ?? "?"}°C / low ${today.mintempC ?? "?"}°C${
        rainChance ? `, rain chance ~${rainChance}%` : ""
      }.`
    );
  }
  return [
    {
      title: `Weather — ${placeName}`,
      url: `https://wttr.in/${encodeURIComponent(place)}`,
      snippet: lines.join(" "),
    },
  ];
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Google News RSS — no API key; good for “current events” / headlines. */
export async function googleNewsRssHits(
  query: string,
  timeoutMs = 8_000
): Promise<WebHit[]> {
  if (!looksLikeNewsQuery(query)) return [];
  const q = query.trim().slice(0, 120);
  const url =
    "https://news.google.com/rss/search?" +
    new URLSearchParams({
      q,
      hl: "en-IN",
      gl: "IN",
      ceid: "IN:en",
    }).toString();
  const res = await fetchWithRetry(url, {
    timeoutMs,
    headers: {
      "User-Agent": UA,
      Accept: "application/rss+xml, application/xml, text/xml",
    },
  });
  if (!res.ok) return [];
  const xml = await res.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 5);
  const hits: WebHit[] = [];
  for (const m of items) {
    const block = m[1];
    const title = stripTags(
      (block.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "")
        .replace(/^<!\[CDATA\[/, "")
        .replace(/\]\]>$/, "")
    );
    const link = stripTags(
      (block.match(/<link>([\s\S]*?)<\/link>/i)?.[1] ?? "").trim()
    );
    const desc = stripTags(
      (block.match(/<description>([\s\S]*?)<\/description>/i)?.[1] ?? "")
        .replace(/^<!\[CDATA\[/, "")
        .replace(/\]\]>$/, "")
    );
    if (!title) continue;
    hits.push({
      title,
      url: link,
      snippet: truncateText(desc || title, 400),
    });
  }
  return hits;
}

/**
 * DuckDuckGo HTML results — no API key.
 * Instant Answer JSON is often empty for weather/news; HTML still returns links.
 */
export async function duckDuckGoHtmlHits(
  query: string,
  timeoutMs = 8_000
): Promise<WebHit[]> {
  const url =
    "https://html.duckduckgo.com/html/?" +
    new URLSearchParams({ q: query.trim().slice(0, 200) }).toString();
  const res = await fetchWithRetry(url, {
    timeoutMs,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; ShelfStudyAI/1.0; +https://github.com/shelf)",
      Accept: "text/html",
    },
  });
  if (!res.ok) return [];
  const html = await res.text();
  const hits: WebHit[] = [];
  const re =
    /class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/(?:a|td|div)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && hits.length < 5) {
    const rawHref = m[1];
    const title = stripTags(m[2]);
    const snippet = stripTags(m[3]);
    let href = rawHref;
    // DDG wraps outbound links as //duckduckgo.com/l/?uddg=...
    const uddg = rawHref.match(/[?&]uddg=([^&]+)/);
    if (uddg) {
      try {
        href = decodeURIComponent(uddg[1]);
      } catch {
        href = rawHref;
      }
    }
    if (!title) continue;
    hits.push({
      title,
      url: href.startsWith("http") ? href : "",
      snippet: truncateText(snippet || title, 400),
    });
  }
  return hits;
}
