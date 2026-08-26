import { longPost } from "../../longPost";

export const medicalScience = longPost(
  {
    slug: "medical-and-science-pdf-workflow",
    title: "Medical and Science Students: Annotate Journals, Textbooks, and Protocols in Shelf",
    description: "Organize medical, nursing, and science PDFs in Shelf — highlight mechanisms, ask Study AI for stepwise explanations, and plan lab or exam blocks on the calendar.",
    excerpt: "From NEET PG notes to research protocols: collections by subject, diagram-friendly original PDF view, and Study AI prompts that respect what you uploaded.",
    publishedAt: "2026-03-05",
    tags: ["medical","science","NEET","students"],
  },
  [
    {
      heading: "Subject collections that mirror the syllabus",
      paragraphs: [
        "Create collections for Anatomy, Physiology, Pharmacology — or Physics, Chemistry, Biology for undergrad entrance prep. Topics map to systems or chapters.",
        "Root pages for high-yield formula sheets and drug lists you open daily.",
      ],
    },
    {
      heading: "Diagrams need original PDF view",
      paragraphs: [
        "Histology plates and pathway figures often suffer in pure text mode. Use original PDF view when spatial layout matters; switch to parsed for dense prose.",
        "Sketch notebooks capture pathways you redraw from memory after reading.",
      ],
    },
    {
      heading: "Highlight for mechanisms, not everything",
      paragraphs: [
        "Mark cause–effect chains and contraindications. Ask Study AI: Explain this pathway in steps using only the highlighted text.",
        "Generate short notes the night before viva or MCQ practice.",
      ],
    },
    {
      heading: "Papers and protocols",
      paragraphs: [
        "Upload journal PDFs into a Research topic. Highlight methods you may replicate. Library-wide chat can compare two papers you own — not the open web.",
        "Keep IRB or lab safety PDFs at collection level for quick reference.",
      ],
    },
    {
      heading: "Planner for clinical and exam rhythm",
      paragraphs: [
        "Events for clinics or labs; tasks for chapter completion. Link tasks to the exact textbook page so you open the right PDF when the block starts.",
      ],
    },
    {
      heading: "Study goals",
      paragraphs: [
        "Set NEET PG or a general science-oriented goal when you want AI tone tuned for mechanism-heavy answers. Change goals without reorganizing files.",
      ],
    },
    {
      heading: "Mobile ward or commute review",
      paragraphs: [
        "PWA + reading sync lets you review highlights between sessions. Prefer chapter PDFs so offline cache stays manageable.",
      ],
    },
    {
      heading: "Ethics of AI in medicine study",
      paragraphs: [
        "Shelf AI answers from your uploads — still verify against primary sources before clinical decisions. Use it for learning acceleration, not clinical advice.",
      ],
    }
  ]
);
