import type { ShelfFeature } from "../featureTypes";

export const INTEGRATION_FEATURES: ShelfFeature[] = [

  {
slug: "telegram-pdf-import",
    category: "integrations",
    title: "Import and Send Telegram PDFs with Shelf | Shelf",
    metaDescription:
      "Forward study PDFs from Telegram to Shelf, then send library PDFs back to your Telegram chat. Connect the bot once — same reader, highlights, and Study AI.",
    keywords: [
      "save Telegram PDF to library",
      "Telegram study notes import",
      "forward PDF to study app",
      "Telegram bot PDF shelf",
      "send PDF to Telegram from study app",
    ],
    headline: "Import and send PDFs via Telegram",
    subhead:
      "Link Telegram once, then send or forward PDFs to the Shelf bot. Files appear at your library root. Share sends a library PDF back to the same chat.",
    bullets: [
      "Sign in with Telegram or connect from Settings",
      "Bot saves PDFs to /my-content automatically",
      "Share → Send to Telegram returns a PDF to your bot chat",
      "Import ~20 MB / send ~50 MB (Telegram bot limits)",
    ],
    paragraphs: [
      "Indian study groups run on Telegram. Shelf meets you there — forward a coaching PDF from a channel, study it with highlights, then send the file back to Telegram when a classmate needs it.",
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
    title: "Share Shelf Documents with Classmates | Shelf",
    metaDescription:
      "Share Shelf PDFs and notebooks with classmates — invite by email, view or edit access, Shared with me in the sidebar, optional view links, and save a copy.",
    keywords: [
      "share shelf",
      "share Shelf documents",
      "share PDF with classmates",
      "collaborative study documents",
      "shared with me study library",
      "study PDF sharing app",
      "share notes with class",
    ],
    headline: "Share Shelf with classmates",
    subhead:
      "Invite Shelf users by email with view or edit access. Recipients see Shared with me in their library; owners keep control of rename and delete.",
    bullets: [
      "Share individual pages — not whole collections",
      "View vs edit per collaborator",
      "Optional link access for signed-in users",
      "Save a copy, or send the PDF back to Telegram",
    ],
    paragraphs: [
      "Search for “share Shelf” when you need controlled PDF sharing instead of chat attachments. Study groups pass coaching PDFs; teachers share lesson handouts. Annotations stay per person, and recipients can fork a copy when they need their own highlights.",
    ],
    relatedBlogSlug: "share-study-documents",
    ctaHref: "/login",
    ctaLabel: "Share a document",
  },
];
