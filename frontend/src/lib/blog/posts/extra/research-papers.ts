import { longPost } from "../../longPost";

export const researchPapers = longPost(
  {
    slug: "research-papers-literature-notes",
    title: "Researchers: Literature Notes, PDF Highlights, and Cross-Paper Questions",
    description: "Build a literature library in Shelf: annotate papers, ask Study AI across your PDF set, keep typed synthesis docs, and track reading tasks without losing citations context.",
    excerpt: "One collection per project, papers as pages, color highlights for methods vs claims, and AI chat scoped to your corpus — a researcher-friendly Shelf workflow.",
    publishedAt: "2026-03-06",
    tags: ["research","literature review","academia","PDF"],
  },
  [
    {
      heading: "Project-scoped collections",
      paragraphs: [
        "Name a collection after the paper or grant. Topics for Related work, Methods refs, and To cite. Keep your manuscript draft as a doc page in the same collection.",
        "Avoid mixing unrelated fields in one collection — retrieval quality drops when scope is too wide.",
      ],
    },
    {
      heading: "Annotation that supports writing",
      paragraphs: [
        "Highlight claims you will cite; mark methods that influence your design. Use Study AI: Extract the contribution statement from this abstract and related work section.",
        "Paste extractions bullets into a synthesis doc page with your own critique beneath.",
      ],
    },
    {
      heading: "Cross-paper comparison",
      paragraphs: [
        "Library-wide Study AI with collection scope: Contrast evaluation metrics used in papers A and B. Follow up: Which limitations appear in both?",
        "Always open the cited PDF to verify — AI accelerates skimming, humans own the citation.",
      ],
    },
    {
      heading: "Split view for writing",
      paragraphs: [
        "Draft doc on one side, source paper on the other. Tabs for multiple papers during lit review marathons.",
      ],
    },
    {
      heading: "Planner as research ops",
      paragraphs: [
        "Tasks: Finish related-work skim, Submit IRB, Draft results. Link to pages. Events for lab meetings.",
      ],
    },
    {
      heading: "Storage and file hygiene",
      paragraphs: [
        "Prefer publisher PDFs with selectable text. Rename downloads to AuthorYear-ShortTitle before upload for ⌘K searchability.",
      ],
    },
    {
      heading: "Privacy for unpublished work",
      paragraphs: [
        "Your library is account-private. Do not paste confidential drafts into generic public chatbots when Shelf can answer from local uploads instead.",
      ],
    },
    {
      heading: "From notes to manuscript",
      paragraphs: [
        "Weekly: ask Study AI for a mind map of themes in this month’s highlights. Use it as an outline checkpoint, then write in your own voice.",
      ],
    }
  ]
);
