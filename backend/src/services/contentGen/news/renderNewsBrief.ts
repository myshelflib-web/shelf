import type { NewsBrief, NewsCluster } from "./newsTypes.js";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function block(heading: string, paragraphs: string[]): string {
  if (!paragraphs.length) return "";
  return `<section><h2>${esc(heading)}</h2>${paragraphs
    .map((p) => `<p>${esc(p)}</p>`)
    .join("")}</section>`;
}

function bulletBlock(heading: string, items: string[], className: string): string {
  if (!items.length) return "";
  return `<section><h2>${esc(heading)}</h2><ul class="${className}">${items
    .map((i) => `<li>${esc(i)}</li>`)
    .join("")}</ul></section>`;
}

/** Attribution block: every source that fed the synthesis is named and linked. */
function sourcesHtml(cluster: NewsCluster): string {
  return `<section class="shelf-doc-sources"><h2>Reported by</h2><p>This brief is Shelf's own summary of a development covered by the sources below. Open them for the full reports.</p><ul>${cluster.items
    .map(
      (item) =>
        `<li><a href="${esc(item.canonicalUrl)}" target="_blank" rel="noopener noreferrer">${esc(
          item.sourceName
        )}</a></li>`
    )
    .join("")}</ul></section>`;
}

export function renderNewsBriefHtml(brief: NewsBrief, cluster: NewsCluster): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(brief.title)}</title>
<meta name="description" content="${esc(brief.metaDescription)}" />
<meta name="keywords" content="${esc(brief.keywords.join(", "))}" />
</head>
<body>
<header class="doc-masthead"><h1>${esc(brief.title)}</h1><p>${esc(
    brief.syllabusLinks.join(" · ")
  )}</p></header>
${block("What happened", brief.whatHappened)}
${block("Why it matters", brief.whyItMatters)}
${bulletBlock("Key facts", brief.keyFacts, "shelf-doc-takeaways")}
${bulletBlock("Prelims pointers", brief.prelimsPointers, "shelf-doc-pointers")}
${bulletBlock("Mains angle", brief.mainsAngle, "shelf-doc-pointers")}
${bulletBlock("Syllabus links", brief.syllabusLinks, "shelf-doc-bullets")}
${sourcesHtml(cluster)}
</body>
</html>`;
}

export function renderNewsBriefText(brief: NewsBrief, cluster: NewsCluster): string {
  const parts: string[] = [
    brief.title,
    "=".repeat(Math.min(brief.title.length, 80)),
    "",
    "What happened",
    "-------------",
    ...brief.whatHappened,
    "",
    "Why it matters",
    "--------------",
    ...brief.whyItMatters,
    "",
  ];

  const section = (heading: string, items: string[]) => {
    if (!items.length) return;
    parts.push(heading, "-".repeat(heading.length));
    parts.push(...items.map((i) => `- ${i}`), "");
  };

  section("Key facts", brief.keyFacts);
  section("Prelims pointers", brief.prelimsPointers);
  section("Mains angle", brief.mainsAngle);
  section("Syllabus links", brief.syllabusLinks);
  section(
    "Reported by",
    cluster.items.map((i) => `${i.sourceName} — ${i.canonicalUrl}`)
  );

  return parts.join("\n").trim() + "\n";
}
