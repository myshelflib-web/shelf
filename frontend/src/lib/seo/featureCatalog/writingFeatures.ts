import type { ShelfFeature } from "../featureTypes";

/** Research writing + originality tools on typed Docs / selections. */
export const WRITING_FEATURES: ShelfFeature[] = [
  {
    slug: "research-doc-writing",
    category: "library",
    title: "Research Doc Writing Suite — Citations, Export & Outlines | Shelf",
    metaDescription:
      "Write research papers in Shelf Docs: APA/MLA/Chicago/IEEE citations, BibTeX import, outline and word count, footnotes, equations, MD/PDF/DOC/LaTeX export, history, comments, and templates.",
    keywords: [
      "research paper writing app",
      "citation manager with PDF library",
      "APA MLA citation tool students",
      "export notes to LaTeX",
      "IMRaD paper template",
      "literature review notes app",
      "BibTeX import study app",
    ],
    headline: "Write research papers in your library",
    subhead:
      "Typed Docs are no longer just notes. Shelf adds citations, bibliography styles, outlines, footnotes, KaTeX equations, version history, suggest mode, and export — beside the PDFs you cite.",
    bullets: [
      "APA, MLA, Chicago, and IEEE in-text cites plus bibliography refresh",
      "Import BibTeX / CSL-JSON (including Zotero exports)",
      "Cite a PDF highlight into an open Doc with page locator",
      "Export Markdown, PDF, Word, or LaTeX from the Doc toolbar",
      "Outline, word count, footnotes, figures, equations, and templates",
      "History snapshots, comments, and suggest-mode track changes",
    ],
    paragraphs: [
      "Researchers and thesis writers usually juggle a PDF library, a word processor, and a reference manager. Shelf keeps sources and drafts in one place: highlight a paper, cite into a Doc, rebuild References, then export for your journal or advisor.",
      "Templates cover abstract, literature review, methods, IMRaD, thesis chapter, and cover letter. Research AI assists can tighten an abstract or check claims against bibliography keys — using the same Study AI token pool.",
    ],
    relatedBlogSlug: "research-doc-writing-suite",
    ctaHref: "/login",
    ctaLabel: "Start a research Doc",
    secondaryCtaHref: "/blog/research-doc-writing-suite",
    secondaryCtaLabel: "Read the guide",
  },
  {
    slug: "writing-assist-originality",
    category: "study-ai",
    title: "Paraphrase & Library Originality Check | Shelf",
    metaDescription:
      "Paraphrase selections from PDFs or Docs and check originality against your Shelf library and syllabus. Premium web plagiarism via Copyleaks when configured.",
    keywords: [
      "paraphrase PDF selection",
      "library originality check",
      "plagiarism check own notes",
      "rewrite study notes AI",
      "syllabus overlap checker",
      "web plagiarism checker students",
    ],
    headline: "Rewrite in your words. Check against your library.",
    subhead:
      "Paraphrase a highlight or Doc passage with Study AI. Originality reports library and syllabus overlap — and Premium web scans when a plagiarism vendor key is configured.",
    bullets: [
      "Paraphrase, Simplify, Formal, and Shorten from the selection bar",
      "Insert paraphrases back into typed Docs",
      "Library self-check via the same vector index as Study AI",
      "Syllabus / relevancy-doc overlap for exam framing",
      "Optional AI-writing heuristic (token-metered, labeled as a hint)",
      "Premium web originality through Copyleaks when API keys are set",
    ],
    paragraphs: [
      "Shelf’s originality tools help you spot reused personal notes and syllabus phrasing while you write — not a fake Turnitin clone. Free and Premium include library and syllabus layers; public-web scanning stays Premium and only runs when a vendor is connected.",
      "Use paraphrase to study in your own words. Use originality before you submit a draft to catch accidental copy-paste from your own uploads.",
    ],
    relatedBlogSlug: "paraphrase-and-library-originality",
    ctaHref: "/login",
    ctaLabel: "Try writing assist",
    secondaryCtaHref: "/blog/paraphrase-and-library-originality",
    secondaryCtaLabel: "How originality works",
  },
];
