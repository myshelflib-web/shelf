import { buildPost } from "../types";

export const pdfReaderHighlights = buildPost(
  {
    slug: "pdf-reader-highlights-annotations",
    title: "Read PDFs with Highlights, Ink, and Notes on Shelf",
    description:
      "Highlight passages, draw with pen tools, add notes, and reopen PDFs instantly with Shelf's reader. Range-fetch streaming plus local byte cache for smooth study sessions.",
    excerpt:
      "Shelf treats every uploaded PDF as a first-class document: color highlights, pen markup, text selection, and notes that stay attached to the page.",
    publishedAt: "2026-01-18",
    updatedAt: "2026-08-31",
    tags: ["pdf", "highlights", "reader", "annotations"],
    readingMinutes: 7,
  },
  [
    {
      heading: "One PDF per page, streamed efficiently",
      paragraphs: [
        "When you upload a PDF, Shelf stores the full file once in cloud storage. The reader uses presigned URLs and HTTP Range requests so PDF.js can fetch only the bytes it needs — you are not waiting for a entire 200 MB file before page one appears.",
        "After the first open, Shelf caches PDF bytes in IndexedDB (LRU, roughly five documents / 80 MB) so reopening the same paper feels instant, even on slower connections.",
      ],
    },
    {
      heading: "Highlighting and notes",
      paragraphs: [
        "Select text on HTML notes or use the highlight toolbar on PDFs. Pick yellow, green, blue, or pink — colors persist on the page for later revision. Click a highlight to attach a note or remove it.",
        "PDF pen mode supports small, medium, and large stroke sizes with optional auto-straightening for cleaner diagrams and underlines.",
      ],
    },
    {
      heading: "Reading comfort",
      paragraphs: [
        "Night mode inverts page bitmaps for late sessions. Scroll position, zoom, and current PDF page restore when you return — locally and, when signed in, synced to your account so another device picks up where you left off.",
      ],
      bullets: [
        "Keyboard shortcuts for page navigation in the reader",
        "Schedule reading creates a planner task linked back to the page",
        "Undo for recent PDF page deletes within a session",
      ],
    },
    {
      heading: "Highlights & notes list",
      paragraphs: [
        "Use the list button in the PDF toolbar to browse every mark on the current page — highlighted text, pen strokes, and attached notes. The list loads in the background while you keep reading.",
        "Click any snippet to jump back to that spot in the PDF or HTML document. PDFs scroll to the correct page and position; long lists paginate so heavily annotated papers stay fast.",
      ],
    },
    {
      heading: "Why highlights matter for Study AI",
      paragraphs: [
        "Highlights are not just cosmetic. When you ask Study AI from the reader panel, selected text becomes context for the answer. Mark the paragraph you care about, open Ask AI, and get an explanation grounded in that exact passage from your upload.",
      ],
    },
  ]
);
