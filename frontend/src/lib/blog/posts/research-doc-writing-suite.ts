import { buildPost } from "../types";

export const researchDocWritingSuite = buildPost(
  {
    slug: "research-doc-writing-suite",
    title: "Write Research Papers in Shelf Docs",
    description:
      "Citations, outlines, footnotes, equations, export, version history, comments, templates, and research AI — all inside typed Shelf Docs.",
    excerpt:
      "Shelf Docs now include a research writing suite: APA/MLA citations, BibTeX import, outline and word count, MD/PDF/DOC/LaTeX export, and more.",
    publishedAt: "2026-09-07",
    tags: ["docs", "citations", "research", "writing", "export"],
    readingMinutes: 12,
  },
  [
    {
      heading: "Citations and your reference library",
      paragraphs: [
        "Open Sources from the Doc toolbar to add references by hand or paste BibTeX / CSL-JSON (including exports from Zotero). Cite inserts an in-text marker; Refresh bibliography rebuilds the References block in APA, MLA, Chicago, or IEEE.",
        "From a PDF or HTML highlight, choose Cite to drop a quote plus citation into an open Doc tab. If no Doc is open, Shelf prompts you so the action is never a silent no-op.",
      ],
    },
    {
      heading: "Structure as you write",
      paragraphs: [
        "Outline lists H1–H3 headings for click-to-scroll navigation. The footer shows word and character counts plus an estimated reading time. Find in library searches your notes and PDFs so you can insert quotes without leaving the Doc.",
        "Insert footnotes, figures, tables, KaTeX equations, cross-refs, and glossary terms from the research toolbar. Markers round-trip with Doc autosave HTML.",
      ],
    },
    {
      heading: "Export, versions, and collaboration",
      paragraphs: [
        "Export Markdown, PDF, Word (.doc), or LaTeX from the Doc toolbar. History snapshots save as you edit so you can compare and restore drafts. Comments attach to a selection; Suggest mode marks inserts and deletes for accept/reject.",
      ],
    },
    {
      heading: "Templates and research AI",
      paragraphs: [
        "When you create a Doc, pick Blank, Abstract, Literature review, Methods, IMRaD, Thesis chapter, or Cover letter. Tighten shortens an abstract with Study AI tokens; Claims checks wording against bibliography keys.",
        "Paraphrase and library originality from the existing writing tools still work on Docs and PDF selections. Web plagiarism remains a Premium stub until a vendor key is configured.",
      ],
      bullets: [
        "Sources + Cite + bibliography styles",
        "Outline, word count, find-in-library",
        "Export MD / PDF / DOC / LaTeX",
        "History, comments, suggest mode",
        "Research templates on create",
      ],
    },
    {
      heading: "What stays the same",
      paragraphs: [
        "PDF reading, sketch notebooks, Ask AI, page sharing (VIEWER/EDITOR), and Doc autosave of HTML behave as before. Research tools are additive on typed Docs only.",
        "You stay on Shelf’s contentEditable Doc contract — no TipTap migration — so existing notes without research markers open unchanged.",
      ],
    },
    {
      heading: "Getting started in one sitting",
      paragraphs: [
        "Create a Doc with the IMRaD template, import a BibTeX file into Sources, cite while you draft, then export Markdown or LaTeX for your journal workflow.",
        "Use History before a major rewrite, and Suggest mode when a collaborator with EDITOR access leaves tracked edits.",
      ],
    },
  ]
);
