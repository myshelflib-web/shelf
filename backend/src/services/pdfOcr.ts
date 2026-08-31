import { logger, errorFields } from "../utils/logger.js";
import { fetchWithRetry } from "../utils/fetchRetry.js";
import {
  acquireGeminiChatSlot,
  parseGeminiRetryMs,
} from "./geminiLimits.js";
import {
  chatModel,
  geminiNativeBaseUrl,
  isGeminiBaseUrl,
  llmApiKey,
  llmBaseUrl,
  embeddingApiKey,
} from "./llmConfig.js";

const MAX_JPEG_BYTES = Number(process.env.PDF_OCR_JPEG_MAX_BYTES ?? 400 * 1024);

export function pdfOcrEnabled(): boolean {
  return process.env.PDF_OCR !== "false";
}

function ocrKey(): string | undefined {
  return llmApiKey() ?? embeddingApiKey();
}

export function parseGeminiOcrText(data: unknown): string | null {
  const rec = data as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = (rec.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("\n")
    .trim();
  if (!text || /^\[blank page\]$/i.test(text)) return null;
  return text.length >= 20 ? text : null;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** HTML the processor will not clobber (`meta name="shelf-ocr"`). */
export function buildShelfOcrHtml(text: string): string {
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const body = paras
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
  return `<html><head><meta name="shelf-ocr" content="gemini"/></head><body>\n${body}\n</body></html>`;
}

export function pdfPageNeedsOcr(pageText: string): boolean {
  return pageText.replace(/\s+/g, " ").trim().length < 40;
}

/** Transcribe one page JPEG — never a full PDF. */
export async function ocrJpegBuffer(jpeg: Buffer): Promise<string | null> {
  if (!pdfOcrEnabled()) return null;
  if (jpeg.length < 80 || jpeg.length > envPositive(MAX_JPEG_BYTES, 400 * 1024)) {
    return null;
  }
  const key = ocrKey();
  if (!key) return null;
  if (!chatModel().toLowerCase().includes("gemini") && !isGeminiBaseUrl(llmBaseUrl())) {
    return null;
  }

  const slug = chatModel().replace(/^models\//, "");
  const path = `${geminiNativeBaseUrl()}/models/${slug}:generateContent`;
  await acquireGeminiChatSlot();

  const timeoutMs = Number(process.env.PDF_OCR_TIMEOUT_MS ?? 45_000);
  const res = await fetchWithRetry(path, {
    method: "POST",
    timeoutMs,
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": key,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: "Transcribe all readable text on this page in reading order. Include printed text, handwriting, and diagram labels. Plain text only. Do not summarize. If the page is blank, write [blank page].",
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: jpeg.toString("base64"),
              },
            },
          ],
        },
      ],
      generationConfig: { temperature: 0, maxOutputTokens: 4096 },
    }),
  });

  if (res.status === 429) {
    const body = await res.text().catch(() => "");
    const wait = parseGeminiRetryMs(body, 1);
    logger.warn("pdf_ocr.rate_limited", { waitMs: wait });
    return null;
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logger.warn("pdf_ocr.failed", {
      status: res.status,
      body: body.slice(0, 240),
    });
    return null;
  }

  try {
    return parseGeminiOcrText(await res.json());
  } catch (err) {
    logger.warn("pdf_ocr.parse_failed", errorFields(err));
    return null;
  }
}

function envPositive(n: number, fallback: number): number {
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
