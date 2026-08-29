import { errorFields, logger } from "../utils/logger.js";

export type YoutubeVideoMeta = {
  videoId: string;
  title: string;
};

export type YoutubePlaylistMeta = {
  title: string;
  videos: YoutubeVideoMeta[];
  truncated: boolean;
};

export const PLAYLIST_IMPORT_MAX = 80;

const FETCH_MS = 10_000;

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_MS),
    headers: {
      Accept: "application/json, application/atom+xml, text/xml, */*",
      "User-Agent": "ShelfLibrary/1.0",
    },
  });
  if (!res.ok) {
    throw new Error(`YouTube request failed (${res.status})`);
  }
  return res.text();
}

export async function fetchVideoTitle(videoId: string): Promise<string> {
  const watch = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  try {
    const raw = await fetchText(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(watch)}&format=json`
    );
    const json = JSON.parse(raw) as { title?: string };
    const title = json.title?.trim();
    if (title) return title.slice(0, 180);
  } catch (err) {
    logger.debug("youtube.oembed_miss", { videoId, ...errorFields(err) });
  }
  return "YouTube video";
}

function parseRssPlaylist(xml: string): { title: string; videos: YoutubeVideoMeta[] } {
  const feedTitle =
    xml.match(/<feed\b[\s\S]*?<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i)?.[1] ??
    "YouTube playlist";
  const videos: YoutubeVideoMeta[] = [];
  const seen = new Set<string>();
  const entries = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) ?? [];
  for (const entry of entries) {
    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/i)?.[1]?.trim();
    const titleRaw =
      entry.match(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/i)?.[1] ?? videoId ?? "";
    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId) || seen.has(videoId)) {
      continue;
    }
    seen.add(videoId);
    const title = decodeXml(titleRaw) || "YouTube video";
    if (title === "Private video" || title === "Deleted video") continue;
    videos.push({ videoId, title: title.slice(0, 180) });
  }
  return { title: decodeXml(feedTitle).slice(0, 180) || "YouTube playlist", videos };
}

async function fetchPlaylistViaApi(
  playlistId: string,
  apiKey: string
): Promise<YoutubePlaylistMeta> {
  let title = "YouTube playlist";
  try {
    const playlistsRaw = await fetchText(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${encodeURIComponent(playlistId)}&key=${encodeURIComponent(apiKey)}`
    );
    const playlists = JSON.parse(playlistsRaw) as {
      items?: Array<{ snippet?: { title?: string } }>;
    };
    const apiTitle = playlists.items?.[0]?.snippet?.title?.trim();
    if (apiTitle) title = apiTitle.slice(0, 180);
  } catch (err) {
    logger.debug("youtube.playlist_meta_miss", { playlistId, ...errorFields(err) });
  }

  const videos: YoutubeVideoMeta[] = [];
  const seen = new Set<string>();
  let pageToken = "";
  for (let page = 0; page < 4 && videos.length < PLAYLIST_IMPORT_MAX; page++) {
    const params = new URLSearchParams({
      part: "snippet",
      maxResults: "50",
      playlistId,
      key: apiKey,
    });
    if (pageToken) params.set("pageToken", pageToken);
    const raw = await fetchText(
      `https://www.googleapis.com/youtube/v3/playlistItems?${params.toString()}`
    );
    const data = JSON.parse(raw) as {
      nextPageToken?: string;
      items?: Array<{
        snippet?: {
          title?: string;
          resourceId?: { videoId?: string };
        };
      }>;
    };
    for (const item of data.items ?? []) {
      const videoId = item.snippet?.resourceId?.videoId?.trim() ?? "";
      const itemTitle = item.snippet?.title?.trim() ?? "";
      if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId) || seen.has(videoId)) continue;
      if (itemTitle === "Private video" || itemTitle === "Deleted video") continue;
      seen.add(videoId);
      videos.push({
        videoId,
        title: (itemTitle || "YouTube video").slice(0, 180),
      });
      if (videos.length >= PLAYLIST_IMPORT_MAX) break;
    }
    if (!data.nextPageToken || videos.length >= PLAYLIST_IMPORT_MAX) {
      return {
        title,
        videos,
        truncated: Boolean(data.nextPageToken) && videos.length >= PLAYLIST_IMPORT_MAX,
      };
    }
    pageToken = data.nextPageToken;
  }
  return { title, videos, truncated: videos.length >= PLAYLIST_IMPORT_MAX };
}

export async function fetchPlaylist(
  playlistId: string
): Promise<YoutubePlaylistMeta> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (apiKey) {
    return fetchPlaylistViaApi(playlistId, apiKey);
  }

  const xml = await fetchText(
    `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`
  );
  const parsed = parseRssPlaylist(xml);
  if (parsed.videos.length === 0) {
    throw new Error("That playlist has no public videos Shelf can import.");
  }
  const videos = parsed.videos.slice(0, PLAYLIST_IMPORT_MAX);
  return {
    title: parsed.title,
    videos,
    truncated: parsed.videos.length > PLAYLIST_IMPORT_MAX || parsed.videos.length >= 15,
  };
}
