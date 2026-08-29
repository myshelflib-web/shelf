import { logger } from "../utils/logger.js";
import { fetchWithTimeout } from "../utils/timeout.js";
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

export function pdfOcrMaxBytes(): number {
  const n = Number(process.env.PDF_OCR_MAX_BYTES ?? 8 * 1024 * 1024);
  return Number.isFinite(n) && n > 0 ? n : 8 * 1024 * 1024;
}

export function pdfOcrEnabled(): boolean {
  return process.env.PDF_OCR !== "false";
}

function ocrKey(): string | undefined {
  return llmApiKey() ?? embeddingApiKey();
}

/** Transcribe a scanned / image PDF when pdf.js left little text. */
export async function ocrPdfBuffer(pdf: Buffer): Promise<string | null> {
  if (!pdfOcrEnabled()) return null;
  if (pdf.length < 80 || pdf.length > pdfOcrMaxBytes()) return null;
  const key = ocrKey();
  if (!key) return null;
  if (!chatModel().toLowerCase().includes("gemini") && !isGeminiBaseUrl(llmBaseUrl())) {
    return null;
  }

  const slug = chatModel().replace(/^models\//, "");
  const path = `${geminiNativeBaseUrl()}/models/${slug}:generateContent`;
  await acquireGeminiChatSlot();

  const timeoutMs = Number(process.env.PDF_OCR_TIMEOUT_MS ?? 90_000);
  const res = await fetchWithTimeout(path, {
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
              text: "Transcribe every readable page of this PDF in reading order. Include printed text, handwriting, and diagram labels. Use plain text with blank lines between pages. Do not summarize. If a page is blank, write [blank page].",
            },
            {
              inlineData: {
                mimeType: "application/pdf",
                data: pdf.toString("base64"),
              },
            },
          ],
        },
      ],
      generationConfig: { temperature: 0, maxOutputTokens: 8192 },
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
    logger.warn("pdf_ocr.failed", { status: res.status, body: body.slice(0, 240) });
    return null;
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("\n")
    .trim();
  return text.length >= 40 ? text : null;
}
