import { buildPost } from "../types";

export const keyboardShortcuts = buildPost(
  {
    slug: "keyboard-shortcuts-command-search",
    title: "Keyboard Shortcuts and Command-Palette Search on Shelf",
    description:
      "Navigate Shelf fast with ⌘K search, g-then-letter jumps, reader shortcuts, and a ? cheatsheet. Built for keyboard-first study workflows.",
    excerpt:
      "Press ⌘K or / to search your library, g then d for dashboard, ⌘L to ask Study AI on a selection — shortcuts never fire while you type in inputs.",
    publishedAt: "2026-02-27",
    tags: ["keyboard", "shortcuts", "search", "productivity"],
    readingMinutes: 5,
  },
  [
    {
      heading: "Command-palette search",
      paragraphs: [
        "SearchModal opens with ⌘K or /. It lists library hits with keyboard navigation — arrows to move, Enter to open, Esc to close. Optional Study AI suggestions appear when relevant.",
      ],
    },
    {
      heading: "Go sequences",
      paragraphs: [
        "Press g then a letter to jump: dashboard, library, planner, Study AI, settings, and more. Sequences cancel safely if the second key does not match — no accidental navigation.",
      ],
    },
    {
      heading: "Reader shortcuts",
      paragraphs: [
        "Inside a document: ⌘B toggles the library sidebar, ⌘J opens Study AI, arrow keys flip PDF pages, ⌘L asks AI on selected text. Press ? anywhere signed-in to open the full cheatsheet from the header keyboard icon.",
      ],
    },
    {
      heading: "Safe focus handling",
      paragraphs: [
        "Shortcuts do not intercept keys while you are in inputs, contenteditable fields, or pen/draw modes — so note-taking and sketching stay uninterrupted.",
      ],
    },
  ]
);
