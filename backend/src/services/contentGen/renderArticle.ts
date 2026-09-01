import { renderDiagramHtml, renderDiagramText, renderGlanceHtml } from "./renderDiagram.js";
import type {
  GeneratedArticle,
  GeneratedTable,
  ResolvedArticleSpec,
} from "./types.js";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function list(items: string[], className: string): string {
  if (!items.length) return "";
  return `<ul class="${className}">${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
}

function tableHtml(table: GeneratedTable | null | undefined): string {
  if (!table) return "";
  const head = table.columns.map((c) => `<th>${esc(c)}</th>`).join("");
  const body = table.rows
    .map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`)
    .join("");
  const caption = table.caption
    ? `<figcaption>${esc(table.caption)}</figcaption>`
    : "";
  return `<figure class="shelf-doc-table"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>${caption}</figure>`;
}

/** A callout renders as an aside so the reader's sanitizer keeps it intact. */
function callout(
  title: string,
  items: string[],
  variant: "takeaways" | "pointers" | "mistakes" | "linkages"
): string {
  if (!items.length) return "";
  return `<aside class="shelf-callout shelf-callout-${variant}"><h2>${esc(
    title
  )}</h2>${list(items, `shelf-doc-${variant}`)}</aside>`;
}

/** Placement keeps the diagram just after the first section, where it reads best. */
function sectionsHtml(article: GeneratedArticle): string {
  const diagram = renderDiagramHtml(article.diagram);
  return article.sections
    .map((section, index) => {
      const paragraphs = section.paragraphs
        .map((p) => `<p>${esc(p)}</p>`)
        .join("");
      const bullets = list(section.bullets ?? [], "shelf-doc-bullets");
      const table = tableHtml(section.table);
      const afterFirst = index === 0 ? diagram : "";
      return `<section class="shelf-doc-section"><h2>${esc(
        section.heading
      )}</h2>${paragraphs}${bullets}${table}${afterFirst}</section>`;
    })
    .join("");
}

function mastheadHtml(article: GeneratedArticle, spec: ResolvedArticleSpec): string {
  const crumb = [spec.subjectName, spec.topicTitle].filter(Boolean).join(" · ");
  const paper = spec.paper
    ? `<span class="shelf-doc-chip">${esc(spec.paper)}</span>`
    : "";
  return `<header class="doc-masthead shelf-doc-masthead"><p class="shelf-doc-eyebrow">${esc(
    crumb
  )}${paper}</p><h1>${esc(article.title)}</h1><p class="shelf-doc-anchor">${esc(
    spec.syllabusAnchor
  )}</p></header>`;
}

export function renderArticleHtml(
  article: GeneratedArticle,
  spec: ResolvedArticleSpec
): string {
  const sources = spec.officialSources.length
    ? `<section class="shelf-doc-sources"><h2>Primary sources to verify against</h2><ul>${spec.officialSources
        .map(
          (url) =>
            `<li><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a></li>`
        )
        .join("")}</ul></section>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(article.title)}</title>
<meta name="description" content="${esc(article.metaDescription)}" />
<meta name="keywords" content="${esc(article.keywords.join(", "))}" />
</head>
<body>
${mastheadHtml(article, spec)}
<article class="shelf-generated">
<p class="shelf-doc-intro">${esc(article.intro)}</p>
${renderGlanceHtml(article.glance)}
${sectionsHtml(article)}
${callout("Key takeaways", article.keyTakeaways, "takeaways")}
${callout("How this is asked in the exam", article.examPointers, "pointers")}
${callout("Common mistakes to avoid", article.commonMistakes, "mistakes")}
${callout("Connects to", article.linkages, "linkages")}
${sources}
</article>
</body>
</html>`;
}

function tableText(table: GeneratedTable | null | undefined): string[] {
  if (!table) return [];
  const out = [table.caption ? `[Table] ${table.caption}` : "[Table]"];
  out.push(table.columns.join(" | "));
  out.push(...table.rows.map((row) => row.join(" | ")));
  out.push("");
  return out;
}

/** Plain-text twin of the page, stored beside the HTML as the source artifact. */
export function renderArticleText(
  article: GeneratedArticle,
  spec: ResolvedArticleSpec
): string {
  const parts: string[] = [
    article.title,
    "=".repeat(Math.min(article.title.length, 80)),
    "",
    `${spec.subjectName} · ${spec.topicTitle}${spec.paper ? ` · ${spec.paper}` : ""}`,
    `Syllabus: ${spec.syllabusAnchor}`,
    "",
    article.intro,
    "",
  ];

  if (article.glance?.cards.length) {
    parts.push(article.glance.title, "-".repeat(Math.min(article.glance.title.length, 80)));
    parts.push(
      ...article.glance.cards.map((c) => `- ${c.label}: ${c.detail}`),
      ""
    );
  }

  const diagramText = renderDiagramText(article.diagram);

  article.sections.forEach((section, index) => {
    parts.push(section.heading, "-".repeat(Math.min(section.heading.length, 80)));
    parts.push(...section.paragraphs, "");
    for (const bullet of section.bullets ?? []) parts.push(`- ${bullet}`);
    if (section.bullets?.length) parts.push("");
    parts.push(...tableText(section.table));
    if (index === 0 && diagramText) parts.push(diagramText, "");
  });

  const block = (title: string, items: string[]) => {
    if (!items.length) return;
    parts.push(title, "-".repeat(title.length));
    parts.push(...items.map((i) => `- ${i}`), "");
  };

  block("Key takeaways", article.keyTakeaways);
  block("How this is asked in the exam", article.examPointers);
  block("Common mistakes to avoid", article.commonMistakes);
  block("Connects to", article.linkages);
  block("Primary sources", spec.officialSources);

  return parts.join("\n").trim() + "\n";
}
