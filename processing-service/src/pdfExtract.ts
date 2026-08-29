import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  extractTableOfContents,
  normalizePdfText,
  textToHtml,
} from "./pdfText.js";

type PdfTextItem = { str?: string; transform?: number[] };

function yieldEventLoop(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

function pageItemsToLines(items: PdfTextItem[]): string[] {
  const pageLines: string[] = [];
  let lastY: number | null = null;
  let line = "";

  for (const item of items) {
    if (!item.str) continue;
    const y = Math.round(item.transform?.[5] ?? 0);
    if (lastY !== null && Math.abs(y - lastY) > 3) {
      if (line.trim()) pageLines.push(line.trim());
      line = "";
    }
    const str = String(item.str);
    if (
      line &&
      !line.endsWith(" ") &&
      !str.startsWith(" ") &&
      !/^[,.;:!?)]/.test(str)
    ) {
      line += " ";
    }
    line += str;
    lastY = y;
  }
  if (line.trim()) pageLines.push(line.trim());
  return pageLines;
}

export function shouldAbortEmptyPdfExtract(
  pagesRead: number,
  chars: number
): boolean {
  return pagesRead >= 6 && chars < 40;
}

export async function extractPdfText(buffer: Buffer): Promise<{
  text: string;
  numpages: number;
}> {
  const doc = await getDocument({
    data: new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength),
    useSystemFonts: true,
    isEvalSupported: false,
    verbosity: 0,
    disableAutoFetch: true,
  }).promise;

  const pageLines: string[] = [];
  const maxPages = Math.min(doc.numPages, 80);

  try {
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      try {
        const content = await page.getTextContent();
        pageLines.push(...pageItemsToLines(content.items as PdfTextItem[]));
      } finally {
        page.cleanup();
      }
      const chars = pageLines.reduce((n, l) => n + l.length, 0);
      if (shouldAbortEmptyPdfExtract(pageNum, chars)) break;
      await yieldEventLoop();
    }
  } finally {
    try {
      await doc.destroy();
    } catch {
      /* ignore */
    }
  }

  return {
    text: normalizePdfText(pageLines.join("\n")),
    numpages: doc.numPages,
  };
}

export function buildHtmlFromPdfText(text: string): {
  html: string;
  toc: Array<{ id: string; title: string }>;
} {
  const html = textToHtml(text);
  const toc = extractTableOfContents(html);
  let indexedHtml = html;
  toc.forEach((item) => {
    indexedHtml = indexedHtml.replace("<h2>", `<h2 id="${item.id}">`);
  });
  return { html: indexedHtml, toc };
}
