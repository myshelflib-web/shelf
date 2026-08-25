import { buildPost } from "../types";

export const readerWorkspace = buildPost(
  {
    slug: "reader-workspace-tabs-split-view",
    title: "Reader Workspace: Tabs, Split View, and Collapsible Panels",
    description:
      "Shelf's Cursor-inspired reader supports multiple tabs, side-by-side split panes, resizable library and Study AI panels, and persistent layout across sessions.",
    excerpt:
      "Open several PDFs at once, compare sources in a two-pane split, hide panels for focus, and restore tabs plus scroll position when you return.",
    publishedAt: "2026-02-08",
    tags: ["reader", "tabs", "split view", "workspace"],
    readingMinutes: 6,
  },
  [
    {
      heading: "Tabs without reload churn",
      paragraphs: [
        "The reader workspace keeps up to 15 open tabs with 12 recently used documents mounted in memory (hidden) so switching back does not reload PDF.js from scratch. Tab switches use soft URL updates — history.replaceState — so the App Router page does not remount.",
      ],
    },
    {
      heading: "Split view for comparison",
      paragraphs: [
        "Drop a page from the library sidebar onto a pane divider to open side-by-side — useful when cross-referencing a textbook PDF with your case notes. Each pane has its own scroll position and zoom.",
      ],
    },
    {
      heading: "Resizable panels",
      paragraphs: [
        "Library explorer and Study AI panels resize and collapse via react-resizable-panels. Layout and open tabs persist in localStorage under shelf:reader-workspace so your setup survives browser restarts.",
      ],
    },
    {
      heading: "Document fullscreen",
      paragraphs: [
        "Fullscreen mode keeps Study AI docked beside the document inside the fullscreen element — ask-from-selection still works, and you are not kicked out of focus mode to chat.",
      ],
    },
  ]
);
