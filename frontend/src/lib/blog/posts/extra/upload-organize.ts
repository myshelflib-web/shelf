import { longPost } from "../../longPost";

export const uploadOrganize = longPost(
  {
    slug: "how-to-upload-organize-pdfs",
    title: "How to Upload and Organize PDFs in Shelf Without Chaos",
    description: "A practical system for uploading PDFs to Shelf: collection vs topic vs root placement, naming, moving later, parsed vs original view, and keeping a scalable personal library.",
    excerpt: "Stop dumping PDFs into Downloads. Learn when to upload at library root, collection level, or inside a topic — and how Shelf keeps links stable when you rename.",
    publishedAt: "2026-03-02",
    tags: ["upload","organization","PDF","library"],
  },
  [
    {
      heading: "Decide the destination before you upload",
      paragraphs: [
        "If you know the course or project, open that collection first. Upload into a topic when the file belongs to a unit (Week 4, Contracts, Organic Chem). Upload at collection level for syllabi and overviews.",
        "If you are unsure, upload at library root. You can move or retitle later without re-uploading the bytes.",
      ],
    },
    {
      heading: "One PDF, one page",
      paragraphs: [
        "Each Shelf page stores a single source.pdf in object storage. Prefer chapter-sized files over 800-page dumps when you only need one unit this month.",
        "Huge books still work — Range fetching loads pages as you go — but search and Study AI retrieve better when documents are thematically focused.",
      ],
    },
    {
      heading: "Parsed text vs original PDF",
      paragraphs: [
        "Choose parsed mode for selectable text, clean highlights, and Study AI. Choose original when layout, diagrams, or scanned pages matter more than copy-paste.",
        "You can switch modes per page. Processing finishes asynchronously; the reader opens as soon as bytes are available.",
      ],
    },
    {
      heading: "Naming that survives rename",
      paragraphs: [
        "Human titles can change; stable slugs keep planner links and bookmarks working. Rename Polity notes to Constitutional Law without breaking tasks.",
        "Include enough specificity in titles: Case brief — Carlill (not Notes1.pdf).",
      ],
    },
    {
      heading: "Batching a week of material",
      paragraphs: [
        "After a lecture week, upload three PDFs into the same topic in one sitting. Pin the collection so it stays at the top of the explorer.",
        "Sort by recent activity when you return — yesterday’s uploads float without manual starring.",
      ],
    },
    {
      heading: "Duplicates and pruning",
      paragraphs: [
        "Before uploading a second coaching PDF of the same chapter, search with ⌘K. Duplicate files waste storage and confuse Study AI retrieval.",
        "Delete superseded versions after you migrate highlights or notes. Your library should shrink as often as it grows.",
      ],
    },
    {
      heading: "From upload to first highlight",
      paragraphs: [
        "Open the new page immediately and mark one definition. That tiny action turns a file dump into an active study object.",
        "Link a planner task the same day so the PDF has a next action, not just a home on a shelf.",
      ],
    },
    {
      heading: "Scale without folders forever",
      paragraphs: [
        "Collections for majors subjects or clients. Topics for units. Root pages for ephemeral readings. That three-level model covers college, exams, research, and work without nested maze folders.",
      ],
    }
  ]
);
