import { htmlToPlainText } from "./htmlText.js";

const MAX_BODY_CHARS = 120_000;

function truncateBody(text: string): string {
  const t = text.split("\0").join("").trim();
  if (t.length <= MAX_BODY_CHARS) return t;
  return `${t.slice(0, MAX_BODY_CHARS)}\n\n[…truncated]`;
}

/** Extract plain text from an uploaded relevancy / syllabus file. */
export async function extractRelevancyText(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const lower = filename.toLowerCase();
  const mime = (mimeType || "").toLowerCase();

  const isPdf =
    mime === "application/pdf" || lower.endsWith(".pdf");
  const isText =
    mime.startsWith("text/") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".markdown") ||
    mime === "application/json";

  if (isText && !isPdf) {
    const raw = buffer.toString("utf8");
    const body = truncateBody(raw);
    if (!body) throw new Error("File is empty");
    return body;
  }

  if (isPdf) {
    const text = await extractPdfPlainText(buffer);
    const body = truncateBody(text);
    if (!body) {
      throw new Error(
        "Could not extract text from this PDF. Try a text-based PDF or paste the syllabus."
      );
    }
    return body;
  }

  throw new Error("Upload a PDF or .txt / .md file");
}

async function extractPdfPlainText(buffer: Buffer): Promise<string> {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
    }).promise;

    const pageLines: string[] = [];
    const maxPages = Math.min(doc.numPages, 80);

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();
      let lastY: number | null = null;
      let line = "";

      for (const item of content.items) {
        if (!("str" in item) || !item.str) continue;
        const y = Math.round(
          (item as { transform: number[] }).transform[5] ?? 0
        );
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
    }

    return pageLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  } catch (err) {
    // Fallback: strip nulls from binary (rarely useful) — prefer clear error
    const msg = err instanceof Error ? err.message : "PDF parse failed";
    throw new Error(`PDF extract failed: ${msg}`);
  }
}

export function normalizePastedBody(body: string): string {
  const plain = body.includes("<") ? htmlToPlainText(body) : body;
  const t = truncateBody(plain);
  if (!t) throw new Error("Body is empty");
  return t;
}

export function titleFromFilename(filename: string): string {
  const base = filename.replace(/^.*[\\/]/, "").replace(/\.[^.]+$/, "");
  const t = base.replace(/[_-]+/g, " ").trim();
  return t.slice(0, 120) || "Syllabus";
}
