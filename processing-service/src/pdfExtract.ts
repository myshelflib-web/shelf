import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  extractTableOfContents,
  normalizePdfText,
  textToHtml,
} from "./pdfText.js";

export async function extractPdfText(buffer: Buffer): Promise<{
  text: string;
  numpages: number;
}> {
  const doc = await getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  }).promise;

  const pageLines: string[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    let lastY: number | null = null;
    let line = "";

    for (const item of content.items) {
      if (!("str" in item) || !item.str) continue;
      const y = Math.round(item.transform[5]);

      if (lastY !== null && Math.abs(y - lastY) > 3) {
        if (line.trim()) pageLines.push(line.trim());
        line = "";
      }

      const str = item.str;
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
