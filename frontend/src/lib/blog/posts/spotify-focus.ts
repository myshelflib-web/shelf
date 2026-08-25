import { buildPost } from "../types";

export const spotifyFocus = buildPost(
  {
    slug: "spotify-focus-audio-while-reading",
    title: "Spotify Focus Audio Dock While You Read on Shelf",
    description:
      "Play Spotify tracks, playlists, or podcasts beside your PDF with Shelf's focus audio dock — no Shelf OAuth, audio keeps playing when you hide the panel.",
    excerpt:
      "Paste a Spotify link into the reader dock for official embed playback while you highlight and scroll. Per-collection focus playlists optional.",
    publishedAt: "2026-03-02",
    tags: ["spotify", "focus", "reader", "audio"],
    readingMinutes: 4,
  },
  [
    {
      heading: "Focus without leaving the reader",
      paragraphs: [
        "The Spotify mark in the reader chrome opens a fixed-width dock left of Study AI. Paste a track, playlist, or podcast URL — Shelf resolves it to Spotify's dark embed. Login happens inside Spotify's player, not through a Shelf OAuth flow.",
      ],
    },
    {
      heading: "Keep listening while you read",
      paragraphs: [
        "Hiding the dock with × or the toolbar keeps the embed mounted off-screen so audio continues. A floating chip can restore the panel or stop playback. Last URL, recents, and optional per-collection focus playlists persist in localStorage.",
      ],
    },
    {
      heading: "Study ritual",
      paragraphs: [
        "Pair focus audio with scheduled reading tasks: same playlist every time you open a collection builds a cue to enter deep work — especially useful for long PDF sessions before exams.",
      ],
    },
  ]
);
