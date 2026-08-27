import { buildPost } from "../types";

export const telegramSavePdfs = buildPost(
  {
    slug: "telegram-save-pdfs",
    title: "Save Telegram PDFs Straight into Your Shelf Library",
    description:
      "Sign in with Telegram or connect the Shelf bot, then forward study PDFs from chats into My Content without leaving Telegram.",
    excerpt:
      "Link Telegram once, forward PDFs to the Shelf bot, and open them in your personal study library with the same reader and Study AI tools.",
    publishedAt: "2026-08-27",
    tags: ["library", "telegram", "pdf", "import"],
    readingMinutes: 4,
  },
  [
    {
      heading: "Sign in with Telegram",
      paragraphs: [
        "On the Shelf login page, choose Continue with Telegram. Approve the Login Widget in the Telegram app — you land in My Content with your Telegram identity linked. Email/password and Google sign-in still work the same way.",
        "Already signed in? Open the reader and tap the Telegram icon beside Spotify, or go to App settings → Connect Telegram. That opens a one-time bot deep link so your existing library stays on the same account. When linked, the icon shows a connected badge and the panel says Connected to Telegram.",
      ],
    },
    {
      heading: "Forward PDFs to the bot",
      paragraphs: [
        "After linking, send or forward a PDF to the Shelf bot. Shelf saves it to My Content at the library root — same storage and indexing path as an in-app upload. The bot replies with a link to open the file in Shelf.",
        "Telegram bots cap downloads around 20 MB. Larger files should still be uploaded from the Shelf app. Non-PDF files are ignored with a short hint.",
      ],
    },
    {
      heading: "Read and study as usual",
      paragraphs: [
        "Imported PDFs use the same reader workspace: tabs, highlights, and Study AI. Disconnect Telegram anytime from Settings if you want to stop bot imports without deleting your library.",
        "WhatsApp ingest is not part of this release — Telegram is the first messaging path for study PDFs.",
      ],
    },
  ]
);
