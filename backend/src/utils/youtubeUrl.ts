const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
const LIST_ID_RE = /^[a-zA-Z0-9_-]{10,64}$/;

export type YoutubeVideoTarget = {
  kind: "video";
  videoId: string;
  playlistId?: string;
};

export type YoutubePlaylistTarget = {
  kind: "playlist";
  playlistId: string;
};

export type YoutubeTarget = YoutubeVideoTarget | YoutubePlaylistTarget;

function isYoutubeHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "youtu.be" ||
    h === "www.youtu.be" ||
    h === "youtube.com" ||
    h.endsWith(".youtube.com") ||
    h === "youtube-nocookie.com" ||
    h.endsWith(".youtube-nocookie.com")
  );
}

function firstPathSegment(pathname: string): string {
  return pathname.split("/").filter(Boolean)[0] ?? "";
}

function videoIdFromPath(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const kind = parts[0]?.toLowerCase();
  if (kind === "embed" || kind === "shorts" || kind === "live" || kind === "v") {
    const id = parts[1]?.replace(/\.+$/, "") ?? "";
    return VIDEO_ID_RE.test(id) ? id : null;
  }
  return null;
}

export function parseYoutubeUrl(raw: string): YoutubeTarget | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2000) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!isYoutubeHost(url.hostname)) return null;

  const list = url.searchParams.get("list")?.trim() ?? "";
  const playlistId = LIST_ID_RE.test(list) ? list : undefined;
  const pathKind = firstPathSegment(url.pathname).toLowerCase();

  if (pathKind === "playlist") {
    return playlistId ? { kind: "playlist", playlistId } : null;
  }

  let videoId: string | null = null;
  const host = url.hostname.toLowerCase();
  if (host === "youtu.be" || host === "www.youtu.be") {
    const id = firstPathSegment(url.pathname).replace(/\.+$/, "");
    videoId = VIDEO_ID_RE.test(id) ? id : null;
  } else {
    const v = url.searchParams.get("v")?.trim() ?? "";
    if (VIDEO_ID_RE.test(v)) videoId = v;
    else videoId = videoIdFromPath(url.pathname);
  }

  if (videoId) {
    return playlistId
      ? { kind: "video", videoId, playlistId }
      : { kind: "video", videoId };
  }

  if (playlistId) return { kind: "playlist", playlistId };
  return null;
}

export function canonicalWatchUrl(videoId: string, playlistId?: string): string {
  const url = new URL("https://www.youtube.com/watch");
  url.searchParams.set("v", videoId);
  if (playlistId) url.searchParams.set("list", playlistId);
  return url.toString();
}

export function isYoutubeUrl(raw: string): boolean {
  return parseYoutubeUrl(raw) != null;
}
