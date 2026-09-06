import { createDocHtml, serializeDocBody } from "./docEditor";

export type DocTemplateId =
  | "blank"
  | "abstract"
  | "lit-review"
  | "methods"
  | "imrad"
  | "thesis-chapter"
  | "cover-letter";

export type DocTemplate = {
  id: DocTemplateId;
  name: string;
  description: string;
};

export const DOC_TEMPLATES: DocTemplate[] = [
  {
    id: "blank",
    name: "Blank",
    description: "Empty typed Doc with a title heading.",
  },
  {
    id: "abstract",
    name: "Abstract",
    description: "Short abstract with keywords.",
  },
  {
    id: "lit-review",
    name: "Literature review",
    description: "Themes, gaps, and synthesis headings.",
  },
  {
    id: "methods",
    name: "Methods",
    description: "Design, data, and analysis sections.",
  },
  {
    id: "imrad",
    name: "IMRaD paper",
    description: "Introduction, Methods, Results, Discussion.",
  },
  {
    id: "thesis-chapter",
    name: "Thesis chapter",
    description: "Chapter outline with subsections.",
  },
  {
    id: "cover-letter",
    name: "Cover letter",
    description: "Journal submission cover letter shell.",
  },
];

function body(parts: string[]): string {
  return serializeDocBody(parts.join(""));
}

export function htmlForDocTemplate(
  id: DocTemplateId,
  title: string
): string {
  const safe = title.trim() || "Untitled";
  switch (id) {
    case "abstract":
      return body([
        `<h1>${escape(safe)}</h1>`,
        `<h2>Abstract</h2><p><br></p>`,
        `<h2>Keywords</h2><p><br></p>`,
      ]);
    case "lit-review":
      return body([
        `<h1>${escape(safe)}</h1>`,
        `<h2>Introduction</h2><p><br></p>`,
        `<h2>Themes</h2><p><br></p>`,
        `<h2>Gaps</h2><p><br></p>`,
        `<h2>Synthesis</h2><p><br></p>`,
        `<h2>References</h2><p><br></p>`,
      ]);
    case "methods":
      return body([
        `<h1>${escape(safe)}</h1>`,
        `<h2>Research design</h2><p><br></p>`,
        `<h2>Data and materials</h2><p><br></p>`,
        `<h2>Procedure</h2><p><br></p>`,
        `<h2>Analysis</h2><p><br></p>`,
        `<h2>Limitations</h2><p><br></p>`,
      ]);
    case "imrad":
      return body([
        `<h1>${escape(safe)}</h1>`,
        `<h2>Abstract</h2><p><br></p>`,
        `<h2>Introduction</h2><p><br></p>`,
        `<h2>Methods</h2><p><br></p>`,
        `<h2>Results</h2><p><br></p>`,
        `<h2>Discussion</h2><p><br></p>`,
        `<h2>Conclusion</h2><p><br></p>`,
        `<div class="shelf-bibliography" data-style="apa" contenteditable="false"><h2>References</h2><div class="shelf-bib-entries"></div></div>`,
      ]);
    case "thesis-chapter":
      return body([
        `<h1>${escape(safe)}</h1>`,
        `<h2>1. Overview</h2><p><br></p>`,
        `<h2>2. Background</h2><p><br></p>`,
        `<h3>2.1 Key concepts</h3><p><br></p>`,
        `<h2>3. Argument</h2><p><br></p>`,
        `<h2>4. Chapter summary</h2><p><br></p>`,
      ]);
    case "cover-letter":
      return body([
        `<h1>Cover letter</h1>`,
        `<p>Dear Editor,</p>`,
        `<p>Please consider our manuscript <em>${escape(safe)}</em> for publication.</p>`,
        `<p><br></p>`,
        `<p>Sincerely,</p><p><br></p>`,
      ]);
    default:
      return createDocHtml(safe);
  }
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
