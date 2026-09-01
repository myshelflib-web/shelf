import {
  escapeHtml,
  inlineMarkdownToExportHtml,
  looksLikeTex,
  normalizeStudyMarkdown,
  renderMathHtml,
} from "@/lib/studyAiMath";

function splitTableRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

function isTableSeparator(line: string): boolean {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c));
}

function isMermaidSource(lang: string, text: string): boolean {
  const l = lang.toLowerCase();
  return (
    l === "mermaid" ||
    l === "mmd" ||
    (!l && /^\s*(flowchart|graph|sequenceDiagram|classDiagram|mindmap)\b/m.test(text))
  );
}

function pushDisplayMath(out: string[], tex: string) {
  const trimmed = tex.trim();
  if (!trimmed) return;
  if (looksLikeTex(trimmed)) {
    out.push(`<div class="math-block">${renderMathHtml(trimmed, true)}</div>`);
    return;
  }
  out.push(`<p>${inlineMarkdownToExportHtml(trimmed)}</p>`);
}

function collectMultilineMath(
  lines: string[],
  start: number,
  opener: string,
  closer: string
): { text: string; next: number } {
  const first = lines[start].trim();
  const mathLines: string[] = [];
  if (first.length > opener.length) {
    mathLines.push(first.slice(opener.length));
  }
  let i = start + 1;
  while (i < lines.length && !lines[i].trim().endsWith(closer)) {
    mathLines.push(lines[i]);
    i += 1;
  }
  if (i < lines.length) {
    const end = lines[i].trim();
    if (end !== closer) mathLines.push(end.replace(new RegExp(`${closer}$`), ""));
    i += 1;
  }
  return { text: mathLines.join("\n"), next: i };
}

/** MD → HTML for PDF/DOC export (tables, math, mermaid placeholders). */
export function markdownToExportHtml(md: string): string {
  const lines = normalizeStudyMarkdown(md).split("\n");
  const out: string[] = [];
  let inUl = false;
  let inOl = false;
  let inCode = false;
  let codeLang = "";
  let codeBuf: string[] = [];

  const closeLists = () => {
    if (inUl) {
      out.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      out.push("</ol>");
      inOl = false;
    }
  };

  const closeCode = () => {
    const text = codeBuf.join("\n");
    if (isMermaidSource(codeLang, text)) {
      out.push(
        `<div class="mermaid-export" data-mermaid-source="${escapeHtml(text)}"></div>`
      );
    } else {
      out.push(
        `<pre class="code-block"><code>${escapeHtml(text)}</code></pre>`
      );
    }
    codeBuf = [];
    codeLang = "";
    inCode = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCode) {
        closeCode();
      } else {
        closeLists();
        codeLang = trimmed.slice(3).trim();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    if (trimmed.startsWith("$$")) {
      closeLists();
      if (trimmed.endsWith("$$") && trimmed.length > 4) {
        pushDisplayMath(out, trimmed.slice(2, -2));
        continue;
      }
      const block = collectMultilineMath(lines, i, "$$", "$$");
      pushDisplayMath(out, block.text);
      i = block.next - 1;
      continue;
    }

    if (trimmed.startsWith("\\[")) {
      closeLists();
      if (trimmed.endsWith("\\]") && trimmed.length > 4) {
        pushDisplayMath(out, trimmed.slice(2, -2));
        continue;
      }
      const block = collectMultilineMath(lines, i, "\\[", "\\]");
      pushDisplayMath(out, block.text);
      i = block.next - 1;
      continue;
    }

    if (!trimmed) {
      closeLists();
      continue;
    }

    if (
      trimmed.includes("|") &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1].trim())
    ) {
      closeLists();
      const headers = splitTableRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().includes("|")) {
        const row = splitTableRow(lines[i].trim());
        if (!isTableSeparator(lines[i].trim())) rows.push(row);
        i += 1;
      }
      i -= 1;
      out.push("<table><thead><tr>");
      for (const h of headers) {
        out.push(`<th>${inlineMarkdownToExportHtml(h)}</th>`);
      }
      out.push("</tr></thead><tbody>");
      for (const row of rows) {
        out.push("<tr>");
        for (const cell of row) {
          out.push(`<td>${inlineMarkdownToExportHtml(cell)}</td>`);
        }
        out.push("</tr>");
      }
      out.push("</tbody></table>");
      continue;
    }

    const h4 = trimmed.match(/^####\s+(.+)$/);
    const h3 = trimmed.match(/^###\s+(.+)$/);
    const h2 = trimmed.match(/^##\s+(.+)$/);
    const h1 = trimmed.match(/^#\s+(.+)$/);
    const ul = trimmed.match(/^[-*•]\s+(.+)$/);
    const ol = trimmed.match(/^\d+\.\s+(.+)$/);

    if (h1 || h2) {
      closeLists();
      out.push(`<h2>${inlineMarkdownToExportHtml((h1 ?? h2)![1])}</h2>`);
    } else if (h3) {
      closeLists();
      const inlineBody = h3[1].match(/^try next:?\s+(.+)$/i)?.[1]?.trim();
      if (inlineBody) {
        out.push(
          `<div class="study-ai-try-next-export"><div class="study-ai-try-next-label">Try next</div><p>${inlineMarkdownToExportHtml(inlineBody)}</p></div>`
        );
      } else if (/^try next:?$/i.test(h3[1].trim())) {
        let body = "";
        let j = i + 1;
        while (j < lines.length && !lines[j].trim()) j += 1;
        if (j < lines.length) {
          const next = lines[j].trim();
          const isBody =
            !/^#{1,4}\s/.test(next) &&
            !/^[-*•]\s/.test(next) &&
            !/^\d+\.\s/.test(next) &&
            !next.startsWith("```");
          if (isBody) {
            body = next;
            i = j;
          }
        }
        out.push(
          `<div class="study-ai-try-next-export"><div class="study-ai-try-next-label">Try next</div>${body ? `<p>${inlineMarkdownToExportHtml(body)}</p>` : ""}</div>`
        );
      } else {
        out.push(`<h3>${inlineMarkdownToExportHtml(h3[1])}</h3>`);
      }
    } else if (h4) {
      closeLists();
      out.push(`<h4>${inlineMarkdownToExportHtml(h4[1])}</h4>`);
    } else if (ul) {
      if (inOl) {
        out.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        out.push("<ul>");
        inUl = true;
      }
      out.push(`<li>${inlineMarkdownToExportHtml(ul[1])}</li>`);
    } else if (ol) {
      if (inUl) {
        out.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        out.push("<ol>");
        inOl = true;
      }
      out.push(`<li>${inlineMarkdownToExportHtml(ol[1])}</li>`);
    } else {
      closeLists();
      out.push(`<p>${inlineMarkdownToExportHtml(trimmed)}</p>`);
    }
  }

  if (inCode) closeCode();
  closeLists();
  return out.join("\n");
}
