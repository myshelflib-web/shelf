import { buildPost } from "../types";

export const telegramSavePdfs = buildPost(
  {
    slug: "telegram-save-pdfs",
    title: "Save Telegram PDFs Straight into Your Shelf Library",
    description:
      "Connect the Shelf bot, forward study PDFs into My Content, and send library PDFs back to your Telegram chat from Share.",
    excerpt:
      "Link Telegram once, forward PDFs to the Shelf bot, and send annotated library files back to Telegram without leaving Shelf.",
    publishedAt: "2026-08-27",
    updatedAt: "2026-08-29",
    tags: ["library", "telegram", "pdf", "import", "share"],
    readingMinutes: 5,
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
      heading: "Send a library PDF back to Telegram",
      paragraphs: [
        "Share on a page (reader or library) includes Send to Telegram. The bot DMs you the PDF — same chat you already use to import — so you can forward it into a study group. Files over ~50 MB cannot go through the bot; enable Anyone with link and use Share link in Telegram instead.",
        "Notebooks and typed docs are not PDFs, so Send to Telegram posts a Shelf open link rather than a file. Share link in Telegram uses Telegram’s own picker and works for any chat, including groups the bot is not in.",
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
