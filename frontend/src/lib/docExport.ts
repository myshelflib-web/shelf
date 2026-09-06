import { downloadAnswer, downloadMarkdown } from "./exportAnswer";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function safeFilename(title: string): string {
  return (title.trim() || "document").replace(/[^\w\-]+/g, "_").slice(0, 80);
}

function walkToMarkdown(root: HTMLElement): string {
  const lines: string[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent || "";
      if (t) lines.push(t);
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    const tag = node.tagName.toLowerCase();
    if (node.classList.contains("shelf-cite")) {
      const key =
        node.getAttribute("data-bibtex-key") ||
        node.getAttribute("data-source-id") ||
        "";
      lines.push(`[@${key}]`);
      return;
    }
    if (node.classList.contains("shelf-footnote")) {
      const id = node.getAttribute("data-fn-id") || "n";
      lines.push(`[^${id}]`);
      return;
    }
    if (node.classList.contains("shelf-eq")) {
      const latex = node.getAttribute("data-latex") || node.textContent || "";
      lines.push(`$${latex}$`);
      return;
    }
    if (/^h[1-3]$/.test(tag)) {
      const level = Number(tag[1]);
      lines.push(`\n${"#".repeat(level)} ${(node.textContent || "").trim()}\n`);
      return;
    }
    if (tag === "p" || tag === "div" || tag === "li") {
      if (tag === "li") lines.push("\n- ");
      else lines.push("\n");
      node.childNodes.forEach((c) => walk(c));
      lines.push("\n");
      return;
    }
    if (tag === "br") {
      lines.push("\n");
      return;
    }
    node.childNodes.forEach((c) => walk(c));
  };
  walk(root);
  return lines.join("").replace(/\n{3,}/g, "\n\n").trim();
}

export function docBodyToMarkdown(bodyHtml: string, title: string): string {
  const wrap = document.createElement("div");
  wrap.innerHTML = bodyHtml;
  return `# ${title.trim() || "Untitled"}\n\n${walkToMarkdown(wrap)}\n`;
}

export function downloadDocMarkdown(title: string, bodyHtml: string) {
  downloadMarkdown(title, docBodyToMarkdown(bodyHtml, title));
}

export async function downloadDocPdf(title: string, bodyHtml: string) {
  await downloadAnswer("pdf", title, docBodyToMarkdown(bodyHtml, title));
}

export function downloadDocWord(title: string, bodyHtml: string) {
  const name = safeFilename(title);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body>${bodyHtml}</body></html>`;
  triggerDownload(
    new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" }),
    `${name}.doc`
  );
}

export function downloadDocLatex(title: string, bodyHtml: string) {
  const wrap = document.createElement("div");
  wrap.innerHTML = bodyHtml;
  const cites = [...wrap.querySelectorAll(".shelf-cite")] as HTMLElement[];
  const keys = [
    ...new Set(
      cites.map(
        (c) =>
          c.getAttribute("data-bibtex-key") ||
          c.getAttribute("data-source-id") ||
          "ref"
      )
    ),
  ];
  const plain = wrap.innerText || "";
  const tex = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\title{${escapeTex(title)}}
\\begin{document}
\\maketitle
${plain
  .split(/\n+/)
  .map((p) => (p.trim() ? `${escapeTex(p)}\\par` : ""))
  .join("\n")}
${
  keys.length
    ? `\\begin{thebibliography}{99}\n${keys
        .map((k) => `\\bibitem{${escapeTex(k)}} ${escapeTex(k)}`)
        .join("\n")}\n\\end{thebibliography}`
    : ""
}
\\end{document}
`;
  triggerDownload(
    new Blob([tex], { type: "application/x-tex;charset=utf-8" }),
    `${safeFilename(title)}.tex`
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeTex(s: string): string {
  return s.replace(/[\\{}$&#^_~%]/g, (c) => `\\${c}`);
}
