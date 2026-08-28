import type { ShelfFeature } from "../featureTypes";

export const LIBRARY_FEATURES: ShelfFeature[] = [
  {
    slug: "personal-library",
    category: "library",
    title: "Personal Study Library — Collections, Topics & PDF Organization | Shelf",
    metaDescription:
      "Build a private study library on Shelf: collections, topics, and root-level pages for PDFs and notes. Organize coaching material, research papers, and exam PDFs your way.",
    keywords: [
      "personal study library",
      "organize PDF notes",
      "digital notebook students",
      "PDF folder organizer",
      "study material library app",
    ],
    headline: "Your material, your structure",
    subhead:
      "Collections act like notebooks. Topics group related pages. Root-level pages sit beside collections for quick access — no forced “General” folder.",
    bullets: [
      "Library-root, collection-level, and topic-level page placement",
      "Search, sort, pin, and resume reading per collection",
      "Rename in place — stable URLs keep bookmarks working",
      "Private to your account; you upload what you study",
    ],
    paragraphs: [
      "Shelf is built for students who outgrew scattered Downloads folders. Competitive exam PDFs, law case bundles, medical journals, and work documents all live in one calm explorer at /my-content.",
      "Unlike content-catalog apps, Shelf does not push someone else's syllabus first. You bring coaching notes, marked PYQs, and papers — then organize them the way you already think about revision.",
    ],
    relatedBlogSlug: "personal-study-library-collections",
    ctaHref: "/login",
    ctaLabel: "Build your library",
  },
  {
    slug: "pdf-highlights",
    category: "library",
    title: "PDF Reader with Highlights & Annotations | Shelf",
    metaDescription:
      "Highlight PDFs as you read on Shelf. Color-coded passages stay on the page for revision. Range-fetch large files, zoom, and open Study AI from any selection.",
    keywords: [
      "PDF reader with highlights",
      "PDF annotation app",
      "highlight PDF for study",
      "annotate PDF online",
      "revision highlights",
    ],
    headline: "Highlight as you read",
    subhead:
      "Mark passages on pages you uploaded. Colors persist on the document for later revision and feed into Study AI when you ask from a selection.",
    bullets: [
      "Text selection highlights on processed PDFs",
      "Ask Study AI on a highlighted passage or the full page",
      "Smooth PDF.js reader with zoom and progress",
      "Works with your private uploads — not a public catalog",
    ],
    paragraphs: [
      "Shelf treats highlights as first-class study data. Select a paragraph, pick a color, and return weeks later — the marks are still there when you reopen the page.",
      "From any highlight you can jump straight into Study AI for explanations, summaries, or exam-style follow-ups grounded in that passage.",
    ],
    relatedBlogSlug: "pdf-reader-highlights-annotations",
    ctaHref: "/login",
    ctaLabel: "Start highlighting",
  },
  {
    slug: "reader-workspace",
    category: "library",
    title: "Multi-Tab PDF Reader with Split View | Shelf",
    metaDescription:
      "Open multiple PDFs in tabs, compare sources side-by-side, and resize library and Study AI panels. Shelf's reader workspace persists layout across sessions.",
    keywords: [
      "split screen PDF reader",
      "multi tab PDF reader",
      "compare PDF notes",
      "PDF workspace app",
      "side by side PDF study",
    ],
    headline: "Tabs, split view, and focus mode",
    subhead:
      "A Cursor-inspired reader: up to 15 tabs, two-pane split for cross-referencing, collapsible library and Study AI panels, and fullscreen that keeps chat docked.",
    bullets: [
      "Soft tab switches without full page reload",
      "Drop a page onto a pane divider for split view",
      "Resizable panels with layout saved in localStorage",
      "Document fullscreen with Study AI still beside the PDF",
    ],
    paragraphs: [
      "Serious study often means juggling a textbook PDF, your coaching notes, and a syllabus doc. Shelf keeps all three open with independent scroll and zoom per pane.",
      "Panel widths, open tabs, and collapse state restore when you return — so your setup feels like a desk you left, not a fresh browser tab every time.",
    ],
    relatedBlogSlug: "reader-workspace-tabs-split-view",
    ctaHref: "/login",
    ctaLabel: "Open the reader",
  },
  {
    slug: "library-search",
    category: "library",
    title: "Search Your Entire PDF Library | Shelf",
    metaDescription:
      "Find pages, collections, and topics across your Shelf library instantly. Full-text search helps you locate a concept buried in dozens of uploaded PDFs.",
    keywords: [
      "search PDF library",
      "find notes across PDFs",
      "full text PDF search",
      "study library search",
    ],
    headline: "Find anything you uploaded",
    subhead:
      "Search the explorer for page titles and content across collections — so a half-remembered definition in last month's PDF is one query away.",
    bullets: [
      "Search from the library sidebar",
      "Filter and sort collections while searching",
      "Jump straight to the matching page",
      "Pairs with Study AI for semantic follow-up questions",
    ],
    paragraphs: [
      "Keyword search in the explorer complements Study AI's vector retrieval. Use search when you know a title or phrase; use Study AI when you need synthesis across documents.",
    ],
    relatedBlogSlug: "search-your-entire-library",
    ctaHref: "/login",
    ctaLabel: "Search your library",
  },
  {
    slug: "sketch-notes",
    category: "library",
    title: "Sketch Notebook & Typed Doc Pages | Shelf",
    metaDescription:
      "Add sketch pages and typed doc pages beside PDFs in Shelf. Draw diagrams, jot formulas, and keep revision notes in the same collection as your source material.",
    keywords: [
      "digital sketch notes",
      "typed notes beside PDF",
      "diagram notebook students",
      "handwritten notes app",
    ],
    headline: "Sketch and type beside PDFs",
    subhead:
      "Not every page is a PDF. Shelf supports sketch canvases and rich doc pages in the same collections as your uploaded files.",
    bullets: [
      "Sketch pages for diagrams and handwriting",
      "Doc pages for structured typed notes",
      "Live in collections alongside PDFs",
      "Open in the same tabbed reader workspace",
    ],
    paragraphs: [
      "When a concept needs a quick diagram or a worked example you type yourself, you do not need a separate notes app. Shelf keeps notes one click from the PDF they annotate.",
    ],
    relatedBlogSlug: "sketch-notebook-and-doc-pages",
    ctaHref: "/login",
    ctaLabel: "Add a notes page",
  },
  {
    slug: "pin-continue-reading",
    category: "library",
    title: "Pin Collections & Continue Reading | Shelf",
    metaDescription:
      "Pin favourite collections on Shelf, resume where you left off, and track last-read pages per notebook. Cross-device progress when signed in.",
    keywords: [
      "continue reading PDF",
      "pin study collections",
      "reading progress sync",
      "resume PDF study",
    ],
    headline: "Pick up exactly where you stopped",
    subhead:
      "Pin collections to the top of your library and reopen the last page you read in each notebook — on any device after sign-in.",
    bullets: [
      "Per-collection last-read memory",
      "Pin frequently used notebooks",
      "Recently opened pages surface quickly",
      "Synced reading progress across devices",
    ],
    paragraphs: [
      "Exam prep is interrupted constantly. Shelf remembers your place so reopening a 400-page PDF does not mean hunting for page 217 again.",
    ],
    relatedBlogSlug: "pin-collections-continue-reading",
    ctaHref: "/login",
    ctaLabel: "Resume reading",
  },
];
