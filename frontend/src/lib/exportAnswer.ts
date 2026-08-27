/** Client-side export helpers for Study AI answers and full chats. */

import katexPkg from "katex/package.json";
import type { ChatMessage } from "@/types";
import {
  escapeHtml,
  inlineMarkdownToExportHtml,
  looksLikeTex,
  normalizeStudyMarkdown,
  renderMathHtml,
} from "@/lib/studyAiMath";

const KATEX_VERSION = katexPkg.version;

function safeFilename(title: string): string {
  const base = title.trim() || "study-ai-answer";
  return (
    base.replace(/[^\w\s\-().]+/g, "").replace(/\s+/g, "-").slice(0, 80) ||
    "study-ai-answer"
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Lightweight MD → HTML for Word / print-friendly exports (with math). */
export function markdownToExportHtml(md: string): string {
  const lines = normalizeStudyMarkdown(md).split("\n");
  const out: string[] = [];
  let inUl = false;
  let inOl = false;
  let inCode = false;
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

  const pushDisplayMath = (tex: string) => {
    const trimmed = tex.trim();
    if (!trimmed) return;
    if (looksLikeTex(trimmed)) {
      out.push(
        `<div class="math-block">${renderMathHtml(trimmed, true)}</div>`
      );
      return;
    }
    out.push(`<p>${inlineMarkdownToExportHtml(trimmed)}</p>`);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCode) {
        out.push(
          `<pre style="white-space:pre-wrap;font-family:monospace;font-size:12px;background:#f4f4f5;padding:12px;border-radius:8px;">${escapeHtml(codeBuf.join("\n"))}</pre>`
        );
        codeBuf = [];
        inCode = false;
      } else {
        closeLists();
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
        pushDisplayMath(trimmed.slice(2, -2));
        continue;
      }
      const mathLines: string[] = [];
      if (trimmed.length > 2) mathLines.push(trimmed.slice(2));
      i += 1;
      while (i < lines.length && !lines[i].trim().endsWith("$$")) {
        mathLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) {
        const end = lines[i].trim();
        if (end !== "$$") mathLines.push(end.replace(/\$\$$/, ""));
      }
      pushDisplayMath(mathLines.join("\n"));
      continue;
    }

    if (trimmed.startsWith("\\[")) {
      closeLists();
      if (trimmed.endsWith("\\]") && trimmed.length > 4) {
        pushDisplayMath(trimmed.slice(2, -2));
        continue;
      }
      const mathLines: string[] = [];
      if (trimmed.length > 2) mathLines.push(trimmed.slice(2));
      i += 1;
      while (i < lines.length && !lines[i].trim().endsWith("\\]")) {
        mathLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) {
        const end = lines[i].trim();
        if (end !== "\\]") mathLines.push(end.replace(/\\]$/, ""));
      }
      pushDisplayMath(mathLines.join("\n"));
      continue;
    }

    if (!trimmed) {
      closeLists();
      continue;
    }

    const h2 = trimmed.match(/^##\s+(.+)$/);
    const h3 = trimmed.match(/^###\s+(.+)$/);
    const h1 = trimmed.match(/^#\s+(.+)$/);
    const ul = trimmed.match(/^[-*•]\s+(.+)$/);
    const ol = trimmed.match(/^\d+\.\s+(.+)$/);

    if (h1 || h2) {
      closeLists();
      out.push(`<h2>${inlineMarkdownToExportHtml((h1 ?? h2)![1])}</h2>`);
    } else if (h3) {
      closeLists();
      out.push(`<h3>${inlineMarkdownToExportHtml(h3[1])}</h3>`);
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

  if (inCode) {
    out.push(
      `<pre style="white-space:pre-wrap;font-family:monospace;">${escapeHtml(codeBuf.join("\n"))}</pre>`
    );
  }
  closeLists();
  return out.join("\n");
}

const EXPORT_STYLES = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0;
    font-family: Calibri, Arial, sans-serif;
    font-size: 12pt;
    line-height: 1.45;
    color: #111111;
    background: #ffffff;
  }
  h1 { font-size: 18pt; margin: 0 0 0.75em; color: #111111; }
  h2 { font-size: 14pt; margin: 1.2em 0 0.4em; color: #111111; }
  h3 { font-size: 12pt; margin: 1em 0 0.35em; color: #111111; }
  p, li { margin: 0.4em 0; color: #111111; }
  ul, ol { padding-left: 1.25em; }
  code, pre { font-family: Consolas, monospace; font-size: 10pt; color: #111111; }
  a { color: #4444aa; }
  .math-block { margin: 0.75em 0; overflow-x: auto; text-align: center; page-break-inside: avoid; }
  .msg { margin: 1.25em 0; padding: 0.75em 1em; border-radius: 10px; page-break-inside: avoid; }
  .msg-user { background: #eef0ff; border: 1px solid #d8dcf5; }
  .msg-ai { background: #f7f7f5; border: 1px solid #e4e3df; }
  .msg-label {
    font-size: 9pt;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #666666;
    margin-bottom: 0.35em;
  }
  .katex { font-size: 1.05em; color: #111111; }
  .katex-display { margin: 0.5em 0; overflow-x: auto; overflow-y: hidden; }
  .katex .base { position: relative; }
  .katex-error { color: #111111 !important; }
`;

function buildChatExportInnerHtml(
  title: string,
  messages: ChatMessage[]
): string {
  const pageTitle = title.trim() || "Study AI chat";
  const parts = messages
    .filter((m) => m.content.trim())
    .map((m) => {
      const label = m.role === "user" ? "You" : "Study AI";
      const cls = m.role === "user" ? "msg-user" : "msg-ai";
      const body = markdownToExportHtml(m.content);
      return `<section class="msg ${cls}"><div class="msg-label">${label}</div>${body}</section>`;
    });
  return `<h1>${escapeHtml(pageTitle)}</h1>\n${parts.join("\n")}`;
}

function buildExportSrcDoc(bodyInner: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>${EXPORT_STYLES}</style>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/katex.min.css"/>
</head>
<body>${bodyInner}</body>
</html>`;
}

async function waitForIframeReady(iframe: HTMLIFrameElement): Promise<HTMLElement> {
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(
      () => reject(new Error("Export timed out")),
      15_000
    );
    iframe.onload = () => {
      window.clearTimeout(timer);
      resolve();
    };
    iframe.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("Could not render export"));
    };
  });

  const doc = iframe.contentDocument;
  if (!doc?.body) throw new Error("Could not render export");

  const links = [...doc.querySelectorAll('link[rel="stylesheet"]')];
  await Promise.all(
    links.map(
      (link) =>
        new Promise<void>((resolve) => {
          const el = link as HTMLLinkElement;
          if (el.sheet) {
            resolve();
            return;
          }
          el.addEventListener("load", () => resolve(), { once: true });
          el.addEventListener("error", () => resolve(), { once: true });
        })
    )
  );
  await doc.fonts.ready.catch(() => {});
  await new Promise((r) => window.setTimeout(r, 400));
  return doc.body;
}

/** Paginate a tall canvas into A4 pages. */
function addCanvasToPdf(
  pdf: import("jspdf").jsPDF,
  canvas: HTMLCanvasElement,
  margin: number
) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;
  const imgHeight = (canvas.height * contentWidth) / canvas.width;

  let offsetY = 0;
  let pageIndex = 0;

  while (offsetY < imgHeight - 0.5) {
    if (pageIndex > 0) pdf.addPage();

    const sliceHeight = Math.min(contentHeight, imgHeight - offsetY);
    const srcY = (offsetY / imgHeight) * canvas.height;
    const srcH = (sliceHeight / imgHeight) * canvas.height;

    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = Math.max(1, Math.ceil(srcH));
    const ctx = slice.getContext("2d");
    if (!ctx) break;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(
      canvas,
      0,
      srcY,
      canvas.width,
      srcH,
      0,
      0,
      slice.width,
      slice.height
    );

    pdf.addImage(
      slice.toDataURL("image/jpeg", 0.92),
      "JPEG",
      margin,
      margin,
      contentWidth,
      sliceHeight
    );

    offsetY += contentHeight;
    pageIndex += 1;
  }
}

async function downloadHtmlAsPdf(title: string, bodyInner: string) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", "Shelf export");
  Object.assign(iframe.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: "794px",
    height: "1px",
    border: "none",
    opacity: "0",
    pointerEvents: "none",
    zIndex: "-1",
  });
  document.body.appendChild(iframe);
  iframe.srcdoc = buildExportSrcDoc(bodyInner);

  try {
    const body = await waitForIframeReady(iframe);
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const canvas = await html2canvas(body, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: body.scrollWidth,
      height: body.scrollHeight,
      windowWidth: body.scrollWidth,
      windowHeight: body.scrollHeight,
    });

    if (canvas.width < 2 || canvas.height < 2) {
      throw new Error("Export produced empty content");
    }

    const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
    addCanvasToPdf(pdf, canvas, 40);
    pdf.save(`${safeFilename(title)}.pdf`);
  } finally {
    iframe.remove();
  }
}

/** Plain-text fallback when HTML capture fails. */
async function downloadPlainTextPdf(title: string, text: string) {
  const { jsPDF } = await import("jspdf");
  const pageTitle = title.trim() || "Study AI";
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (need: number) => {
    if (y + need > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(17, 17, 17);
  for (const line of doc.splitTextToSize(pageTitle, maxWidth) as string[]) {
    ensureSpace(20);
    doc.text(line, margin, y);
    y += 20;
  }
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  for (const line of doc.splitTextToSize(text, maxWidth) as string[]) {
    ensureSpace(14);
    doc.text(line, margin, y);
    y += 14;
  }

  doc.save(`${safeFilename(title)}.pdf`);
}

function chatToPlainText(title: string, messages: ChatMessage[]): string {
  return messages
    .filter((m) => m.content.trim())
    .map((m) => {
      const who = m.role === "user" ? "You" : "Study AI";
      return `${who}:\n${m.content.trim()}\n`;
    })
    .join("\n");
}

export function downloadMarkdown(title: string, content: string) {
  const name = safeFilename(title);
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  triggerDownload(blob, `${name}.md`);
}

/** Word-compatible HTML saved as .doc (opens in Word / Pages / LibreOffice). */
export function downloadDoc(title: string, content: string) {
  const name = safeFilename(title);
  const pageTitle = title.trim() || "Study AI notes";
  const html = buildExportSrcDoc(
    `<h1>${escapeHtml(pageTitle)}</h1>\n${markdownToExportHtml(content)}`
  );
  const blob = new Blob(["\ufeff", html], {
    type: "application/msword;charset=utf-8",
  });
  triggerDownload(blob, `${name}.doc`);
}

/** Client-side PDF via html2canvas (supports math via KaTeX HTML). */
export async function downloadPdf(title: string, content: string) {
  const pageTitle = title.trim() || "Study AI notes";
  const bodyInner = `<h1>${escapeHtml(pageTitle)}</h1>\n${markdownToExportHtml(content)}`;
  try {
    await downloadHtmlAsPdf(title, bodyInner);
  } catch {
    await downloadPlainTextPdf(title, content);
  }
}

/** Export a full Study AI thread as PDF. */
export async function downloadChatPdf(
  title: string,
  messages: ChatMessage[]
) {
  const transcript = messages.filter((m) => m.content.trim());
  if (transcript.length === 0) {
    throw new Error("Nothing to export yet.");
  }
  try {
    await downloadHtmlAsPdf(title, buildChatExportInnerHtml(title, transcript));
  } catch {
    await downloadPlainTextPdf(title, chatToPlainText(title, transcript));
  }
}

export type DownloadFormat = "md" | "pdf" | "doc";

export async function downloadAnswer(
  format: DownloadFormat,
  title: string,
  content: string
) {
  if (format === "md") downloadMarkdown(title, content);
  else if (format === "doc") downloadDoc(title, content);
  else await downloadPdf(title, content);
}
