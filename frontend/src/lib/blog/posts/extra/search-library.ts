import { longPost } from "../../longPost";

export const searchLibrary = longPost(
  {
    slug: "search-your-entire-library",
    title: "Search Your Entire Shelf Library with Command Palette and Study AI",
    description: "Find any PDF or note fast: ⌘K command-palette search, title and body hits, and Study AI when you remember ideas but not filenames.",
    excerpt: "Keyboard search opens pages instantly. When you only remember a concept, library-wide Study AI retrieves across collections you authorize.",
    publishedAt: "2026-03-15",
    tags: ["search","command palette","productivity","library"],
  },
  [
    {
      heading: "⌘K as the front door",
      paragraphs: [
        "From almost anywhere signed in, ⌘K or / opens search. Arrow keys move, Enter opens, Esc closes. Prefer it over scrolling the sidebar.",
        "Title matches appear quickly; body search improves after processing finishes.",
      ],
    },
    {
      heading: "Name files for future you",
      paragraphs: [
        "Good titles are search infrastructure. Author-topic-year beats scan0031.pdf every time.",
      ],
    },
    {
      heading: "When search fails, ask AI",
      paragraphs: [
        "Library-wide chat: Where did I save notes about spaced repetition? Retrieval looks at meaning, not just filenames.",
        "Narrow scope to one collection if results feel noisy.",
      ],
    },
    {
      heading: "Go sequences for places",
      paragraphs: [
        "g then l, d, p, s jump to library, dashboard, planner, Study AI without search.",
      ],
    },
    {
      heading: "Recent and pinned",
      paragraphs: [
        "Pins and Continue reading cover the hot set; search covers the cold set. Use both.",
      ],
    },
    {
      heading: "Processing lag",
      paragraphs: [
        "Brand-new uploads may not be full-text searchable until HTML and indexing complete. Open by title in the meantime.",
      ],
    },
    {
      heading: "Privacy of search",
      paragraphs: [
        "Search runs on your library — not a public index of other users’ files.",
      ],
    },
    {
      heading: "Make search a habit",
      paragraphs: [
        "Week one challenge: every navigation via ⌘K. Muscle memory pays forever.",
      ],
    }
  ]
);
