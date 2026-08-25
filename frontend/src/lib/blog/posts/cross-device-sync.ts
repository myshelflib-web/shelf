import { buildPost } from "../types";

export const crossDeviceSync = buildPost(
  {
    slug: "cross-device-reading-progress",
    title: "Cross-Device Reading Progress and Last-Read Sync",
    description:
      "Resume PDFs on the same page across devices with Shelf's reading progress sync, last-read collections, and local view state merge.",
    excerpt:
      "Shelf saves PDF page, scroll, and zoom to your account so phone, tablet, and laptop pick up the same document where you stopped.",
    publishedAt: "2026-02-24",
    tags: ["sync", "reading progress", "pdf", "multi-device"],
    readingMinutes: 4,
  },
  [
    {
      heading: "What syncs to your account",
      paragraphs: [
        "When signed in, PATCH /api/my-content/pages/:id/progress stores view state: PDF page number, scroll offset, scale, and timestamp. GET /last-read returns the latest documents per collection for cross-device resume.",
      ],
    },
    {
      heading: "Local-first, merge smart",
      paragraphs: [
        "Shelf hydrates from localStorage and IndexedDB first — reopening a PDF on the same browser stays instant. Account sync revalidates in the background and merges without clobbering newer local sessions when you were offline.",
      ],
    },
    {
      heading: "Continue reading on dashboard",
      paragraphs: [
        "Dashboard and library home use last-read metadata to offer Continue reading — one click returns to the collection and page you touched most recently.",
      ],
    },
  ]
);
