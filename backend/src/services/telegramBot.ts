import { fetchWithTimeout, TimeoutError } from "../utils/timeout.js";
import { logger } from "../utils/logger.js";

const API_BASE = "https://api.telegram.org";
const FETCH_MS = 25_000;

/** Bot API download limit for getFile. */
export const TELEGRAM_BOT_MAX_FILE_BYTES = 20 * 1024 * 1024;

/** Bot API upload limit for sendDocument (multipart). */
export const TELEGRAM_BOT_MAX_SEND_BYTES = 50 * 1024 * 1024;

const SEND_MS = 90_000;

export type TelegramUser = {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
};

export type TelegramDocument = {
  file_id: string;
  file_unique_id?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
};

export type TelegramMessage = {
  message_id: number;
  from?: TelegramUser;
  chat: { id: number; type: string };
  text?: string;
  document?: TelegramDocument;
  caption?: string;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

function botToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN?.trim() || null;
}

export function telegramBotUsername(): string | null {
  const u = process.env.TELEGRAM_BOT_USERNAME?.trim();
  if (!u) return null;
  return u.replace(/^@/, "");
}

export function isTelegramConfigured(): boolean {
  return Boolean(botToken() && telegramBotUsername());
}

async function callApi<T>(
  method: string,
  body?: Record<string, unknown>
): Promise<T> {
  const token = botToken();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");

  const res = await fetchWithTimeout(`${API_BASE}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    timeoutMs: FETCH_MS,
  });
  const json = (await res.json()) as {
    ok: boolean;
    description?: string;
    result?: T;
  };
  if (!res.ok || !json.ok || json.result === undefined) {
    throw new Error(json.description || `Telegram API ${method} failed`);
  }
  return json.result;
}

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  opts?: { parseMode?: "HTML" | "Markdown"; throwOnError?: boolean }
): Promise<void> {
  try {
    await callApi("sendMessage", {
      chat_id: chatId,
      text: text.slice(0, 4000),
      disable_web_page_preview: true,
      ...(opts?.parseMode ? { parse_mode: opts.parseMode } : {}),
    });
  } catch (err) {
    if (err instanceof TimeoutError) {
      logger.warn("telegram.send_timeout", { chatId: String(chatId) });
      if (opts?.throwOnError) throw err;
      return;
    }
    logger.warn("telegram.send_failed", {
      chatId: String(chatId),
      error: err instanceof Error ? err.message : String(err),
    });
    if (opts?.throwOnError) throw err;
  }
}

export async function sendTelegramDocument(opts: {
  chatId: number | string;
  buffer: Buffer;
  filename: string;
  caption?: string;
}): Promise<void> {
  const token = botToken();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");

  const form = new FormData();
  form.append("chat_id", String(opts.chatId));
  form.append(
    "document",
    new File([new Uint8Array(opts.buffer)], opts.filename, {
      type: "application/pdf",
    })
  );
  if (opts.caption) {
    form.append("caption", opts.caption.slice(0, 1024));
  }

  const res = await fetchWithTimeout(`${API_BASE}/bot${token}/sendDocument`, {
    method: "POST",
    body: form,
    timeoutMs: SEND_MS,
  });
  const json = (await res.json()) as { ok: boolean; description?: string };
  if (!res.ok || !json.ok) {
    throw new Error(json.description || "Telegram sendDocument failed");
  }
}

export async function downloadTelegramFile(
  fileId: string
): Promise<{ buffer: Buffer; filePath: string }> {
  const meta = await callApi<{ file_path?: string; file_size?: number }>(
    "getFile",
    { file_id: fileId }
  );
  if (!meta.file_path) {
    throw new Error("Telegram file path missing");
  }
  if (meta.file_size != null && meta.file_size > TELEGRAM_BOT_MAX_FILE_BYTES) {
    throw new Error("File is too large for Telegram bots (max 20 MB)");
  }

  const token = botToken()!;
  const res = await fetchWithTimeout(
    `${API_BASE}/file/bot${token}/${meta.file_path}`,
    { timeoutMs: FETCH_MS }
  );
  if (!res.ok) {
    throw new Error(`Could not download Telegram file (${res.status})`);
  }
  const ab = await res.arrayBuffer();
  const buffer = Buffer.from(ab);
  if (buffer.length > TELEGRAM_BOT_MAX_FILE_BYTES) {
    throw new Error("File is too large for Telegram bots (max 20 MB)");
  }
  return { buffer, filePath: meta.file_path };
}

export function isPdfDocument(doc: TelegramDocument): boolean {
  const mime = (doc.mime_type ?? "").toLowerCase();
  if (mime === "application/pdf" || mime === "application/x-pdf") return true;
  const name = (doc.file_name ?? "").toLowerCase();
  return name.endsWith(".pdf");
}

export function titleFromDocument(doc: TelegramDocument): string {
  const raw = (doc.file_name ?? "").trim() || "Telegram PDF";
  const withoutExt = raw.replace(/\.pdf$/i, "").trim();
  return (withoutExt || "Telegram PDF").slice(0, 120);
}
