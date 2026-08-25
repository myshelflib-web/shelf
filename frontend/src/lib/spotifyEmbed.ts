/** Parse Spotify share links / URIs into dark-theme embed iframe src. */

const EMBED_KINDS = [
  "playlist",
  "track",
  "album",
  "episode",
  "show",
  "artist",
] as const;

export type SpotifyEmbedKind = (typeof EMBED_KINDS)[number];

export type SpotifyEmbedTarget = {
  kind: SpotifyEmbedKind;
  id: string;
  /** open.spotify.com share URL (normalized) */
  openUrl: string;
  /** iframe src with dark theme */
  embedUrl: string;
};

const KIND_SET = new Set<string>(EMBED_KINDS);

/** Spotify base62 ids are typically 22 chars; accept a wider safe range. */
const SPOTIFY_ID = /^[a-zA-Z0-9]{11,32}$/;

function buildEmbed(kind: SpotifyEmbedKind, id: string): SpotifyEmbedTarget {
  return {
    kind,
    id,
    openUrl: `https://open.spotify.com/${kind}/${id}`,
    // theme=0 = dark; compact=false keeps playlist track list for browsing/play
    embedUrl: `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator&theme=0`,
  };
}

/** Compact height for tracks/episodes; taller for playlists/albums/shows. */
export function spotifyEmbedHeight(kind: SpotifyEmbedKind): number {
  if (kind === "track" || kind === "episode") return 152;
  if (kind === "playlist") return 380;
  return 352;
}

/**
 * Accepts open.spotify.com links, spotify.link path embeds, or spotify: URIs.
 * Returns null if the input is not a recognizable Spotify content URL.
 */
export function parseSpotifyInput(raw: string): SpotifyEmbedTarget | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const uri = trimmed.match(
    /^spotify:(playlist|track|album|episode|show|artist):([a-zA-Z0-9]+)$/i
  );
  if (uri) {
    const id = uri[2]!;
    if (!SPOTIFY_ID.test(id)) return null;
    return buildEmbed(uri[1]!.toLowerCase() as SpotifyEmbedKind, id);
  }

  // Bare playlist/track id pasted by power users
  const bare = trimmed.match(
    /^(playlist|track|album|episode|show|artist)[/:]([a-zA-Z0-9]+)$/i
  );
  if (bare) {
    const id = bare[2]!;
    if (!SPOTIFY_ID.test(id)) return null;
    return buildEmbed(bare[1]!.toLowerCase() as SpotifyEmbedKind, id);
  }

  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");
  if (
    host !== "open.spotify.com" &&
    host !== "spotify.link" &&
    !host.endsWith(".spotify.com")
  ) {
    return null;
  }

  // /intl-en/playlist/ID, /embed/playlist/ID, /user/xxx/playlist/ID, /playlist/ID
  const parts = url.pathname.split("/").filter(Boolean);
  const kindIdx = parts.findIndex((p) => KIND_SET.has(p.toLowerCase()));
  if (kindIdx === -1) return null;

  const kind = parts[kindIdx]!.toLowerCase() as SpotifyEmbedKind;
  const id = (parts[kindIdx + 1] ?? "").split("?")[0]!.split("#")[0]!;
  if (!SPOTIFY_ID.test(id)) return null;

  return buildEmbed(kind, id);
}

/** Public editorial playlists — one-tap focus audio (no OAuth). */
export const FOCUS_PLAYLISTS: Array<{
  label: string;
  hint: string;
  url: string;
}> = [
  {
    label: "Deep Focus",
    hint: "Instrumental concentration",
    url: "https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ",
  },
  {
    label: "Lo-Fi Beats",
    hint: "Chill study beats",
    url: "https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn",
  },
  {
    label: "Peaceful Piano",
    hint: "Quiet piano",
    url: "https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO",
  },
  {
    label: "Jazz Vibes",
    hint: "Background jazz",
    url: "https://open.spotify.com/playlist/37i9dQZF1DX0SM0LYsmbMT",
  },
];
