import { fetchWithRetry } from "../../../utils/fetchRetry.js";
import { logger } from "../../../utils/logger.js";

export type OpenverseImage = {
  title: string;
  imageUrl: string;
  creator: string;
  creatorUrl: string;
  license: string;
  landingUrl: string;
};

const OPENVERSE =
  "https://api.openverse.org/v1/images/?license=cc0,pdm,by,by-sa&page_size=5";

/** Exam-aware hint so medical vs UPSC queries differ without an LLM call. */
export function visualSearchQuery(
  title: string,
  studyGoal: string
): string {
  const base = title.replace(/\s+/g, " ").trim().slice(0, 120);
  if (studyGoal === "NEET_PG") return `${base} medical anatomy diagram`;
  if (studyGoal === "UPSC" || studyGoal === "STATE_PCS") {
    return `${base} India map diagram`;
  }
  if (studyGoal === "JUDICIARY") return `${base} law India`;
  if (studyGoal === "GATE") return `${base} engineering diagram`;
  return `${base} educational diagram`;
}

function parseHit(raw: Record<string, unknown>): OpenverseImage | null {
  const imageUrl =
    (typeof raw.url === "string" && raw.url) ||
    (typeof raw.thumbnail === "string" && raw.thumbnail) ||
    "";
  if (!imageUrl.startsWith("https://")) return null;

  const creator = typeof raw.creator === "string" ? raw.creator : "Unknown";
  const creatorUrl =
    typeof raw.creator_url === "string" ? raw.creator_url : "";
  const license = typeof raw.license === "string" ? raw.license : "CC";
  const landingUrl =
    typeof raw.foreign_landing_url === "string"
      ? raw.foreign_landing_url
      : typeof raw.detail_url === "string"
        ? raw.detail_url
        : imageUrl;
  const title =
    typeof raw.title === "string" && raw.title.trim()
      ? raw.title.trim()
      : "Illustration";

  return {
    title,
    imageUrl,
    creator,
    creatorUrl,
    license,
    landingUrl,
  };
}

/** Free CC / PD image search — no API key. */
export async function searchOpenverseImages(
  query: string
): Promise<OpenverseImage[]> {
  const q = query.trim().slice(0, 200);
  if (!q) return [];

  const url = `${OPENVERSE}&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetchWithRetry(url, {
      timeoutMs: 12_000,
      headers: { Accept: "application/json", "User-Agent": "ShelfContentGen/1.0" },
    });
    if (!res.ok) {
      logger.warn("visual.openverse.failed", { status: res.status, q });
      return [];
    }
    const data = (await res.json()) as { results?: Record<string, unknown>[] };
    const hits: OpenverseImage[] = [];
    for (const row of data.results ?? []) {
      const hit = parseHit(row);
      if (hit) hits.push(hit);
      if (hits.length >= 3) break;
    }
    return hits;
  } catch (err) {
    logger.warn("visual.openverse.error", {
      q,
      message: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}
