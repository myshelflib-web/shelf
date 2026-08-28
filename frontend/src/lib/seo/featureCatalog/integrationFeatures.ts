import type { ShelfFeature } from "../featureTypes";

export const INTEGRATION_FEATURES: ShelfFeature[] = [

  {
slug: "telegram-pdf-import",
    category: "integrations",
    title: "Save Telegram PDFs to Your Shelf Library | Shelf",
    metaDescription:
      "Forward study PDFs from Telegram to Shelf. Sign in with Telegram or connect the bot — PDFs land in My Content with the same reader, highlights, and Study AI.",
    keywords: [
      "save Telegram PDF to library",
      "Telegram study notes import",
      "forward PDF to study app",
      "Telegram bot PDF shelf",
    ],
    headline: "Forward PDFs from Telegram",
    subhead:
      "Link Telegram once, then send or forward PDFs to the Shelf bot. Files appear at your library root with a link to open in the reader.",
    bullets: [
      "Sign in with Telegram or connect from Settings",
      "Bot saves PDFs to /my-content automatically",
      "Same indexing path as in-app uploads",
      "Best for files under ~20 MB (Telegram bot limit)",
    ],
    paragraphs: [
      "Indian study groups run on Telegram. Shelf meets you there — forward a coaching PDF from a channel and read it with highlights and Study AI minutes later.",
    ],
    relatedBlogSlug: "telegram-save-pdfs",
    ctaHref: "/login",
    ctaLabel: "Connect Telegram",
  },
{
    slug: "spotify-focus-audio",
    category: "integrations",
    title: "Spotify Focus Audio While Reading PDFs | Shelf",
    metaDescription:
      "Play Spotify tracks, playlists, or podcasts beside your PDF on Shelf. Official embed dock — audio keeps playing when you hide the panel and read fullscreen.",
    keywords: [
      "Spotify study app",
      "focus music while studying",
      "read PDF with music",
      "study playlist PDF reader",
    ],
    headline: "Spotify beside your PDF",
    subhead:
      "Paste a Spotify link into the reader dock. Login happens in Spotify's player — audio continues when you collapse the panel or enter fullscreen.",
    bullets: [
      "Track, playlist, or podcast embeds",
      "Per-collection focus playlist memory",
      "Floating chip to restore or stop playback",
      "No Shelf OAuth — uses Spotify's official embed",
    ],
    paragraphs: [
      "Deep work often needs a consistent audio cue. Shelf keeps Spotify one click away without alt-tabbing to another window or losing your place in the PDF.",
    ],
    relatedBlogSlug: "spotify-focus-audio-while-reading",
    ctaHref: "/login",
    ctaLabel: "Read with focus audio",
  },
{
    slug: "document-sharing",
    category: "integrations",
    title: "Share Study PDFs with Classmates on Shelf",
    metaDescription:
      "Share PDF and notebook pages with classmates on Shelf. View or edit access, Shared with me in the sidebar, and save an independent copy to your library.",
    keywords: [
      "share PDF with classmates",
      "collaborative study documents",
      "shared with me study library",
      "study PDF sharing app",
    ],
    headline: "Share pages with classmates",
    subhead:
      "Invite Shelf users by email with view or edit access. Recipients see Shared with me in their library; owners keep control of rename and delete.",
    bullets: [
      "Share individual pages — not whole collections",
      "View vs edit per collaborator",
      "Optional link access for signed-in users",
      "Save a copy into your own library",
    ],
    paragraphs: [
      "Study groups pass PDFs constantly. Shelf sharing keeps access controlled — annotations stay per person, and recipients can fork a copy when they need their own highlights.",
    ],
    relatedBlogSlug: "share-study-documents",
    ctaHref: "/login",
    ctaLabel: "Share a document",
  },
];
