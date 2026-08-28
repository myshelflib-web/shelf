import { buildPost } from "../types";

export const sketchAndDoc = buildPost(
  {
    slug: "sketch-notebook-and-doc-pages",
    title: "Sketch Notebooks and Rich Text Doc Pages on Shelf",
    description:
      "Create multi-page sketch notebooks with ruled or grid paper, or typed Doc pages with headings and lists. Import TXT, MD, and DOCX into your library.",
    excerpt:
      "Beyond PDF uploads: draw on A4 sheets, type structured notes, or import existing documents — all live beside PDFs in your collections.",
    publishedAt: "2026-02-11",
    updatedAt: "2026-08-28",
    tags: ["notebook", "sketch", "doc editor", "notes"],
    readingMinutes: 6,
  },
  [
    {
      heading: "Three page types",
      paragraphs: [
        "Shelf pages can be PDFs (uploaded or linked), HTML documents (imported or edited), or sketch notebooks. Pick Add page → Notebook for draw-only multi-sheet editors, or Add page → Doc for typed rich text without ink.",
      ],
    },
    {
      heading: "Sketch notebooks",
      paragraphs: [
        "Notebook pages use fixed A4 sheets with ruled, grid, or blank paper and a GoodNotes-style color palette. Add sheets with + Page when a diagram spills over. Legacy blank-canvas pages (combined type and draw) still open for older content.",
      ],
    },
    {
      heading: "Doc editor",
      paragraphs: [
        "Doc pages support headings, lists, fonts, and colors — ideal for lecture notes you type directly in Shelf. HTML imports from TXT, MD, or DOCX can be highlighted and edited where the legacy flow allows.",
      ],
    },
    {
      heading: "Same library, same AI",
      paragraphs: [
        "PDFs, Doc pages, sketch notebooks with typed text boxes, and imported TXT/MD/DOCX all get vector chunks for Study AI — including catalog metadata and your highlights/notes. Ask on typed notes the same way you would on a chapter PDF. On sketch notebooks, Summarize and Ask send a snapshot of the visible sheet to Study AI so handwriting and diagrams can be read even when there is no extractable text.",
      ],
    },
  ]
);
