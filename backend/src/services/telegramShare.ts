import prisma from "../utils/prisma.js";
import { findAccessiblePage } from "../utils/pageAccess.js";
import { pageHref } from "../utils/docPaths.js";
import { getObjectBuffer } from "./s3.js";
import { getAppUrl } from "./email/config.js";
import {
  isTelegramConfigured,
  sendTelegramDocument,
  sendTelegramMessage,
  TELEGRAM_BOT_MAX_SEND_BYTES,
} from "./telegramBot.js";

export class TelegramShareError extends Error {
  status: number;

  constructor(status: number, userMessage: string) {
    super(userMessage);
    this.name = "TelegramShareError";
    this.status = status;
  }
}

export function pdfFilenameForTelegram(title: string): string {
  const cleaned = title
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  const base = cleaned || "document";
  return /\.pdf$/i.test(base) ? base : `${base}.pdf`;
}

export function telegramApiErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();
  if (lower.includes("blocked by the user")) {
    return "Unblock the Shelf bot in Telegram, then try again.";
  }
  if (
    lower.includes("can't initiate conversation") ||
    lower.includes("chat not found") ||
    lower.includes("bot was kicked")
  ) {
    return "Open the Shelf bot in Telegram and tap Start, then try again.";
  }
  if (lower.includes("too large") || lower.includes("file is too big")) {
    return "That PDF is too large for Telegram (max 50 MB). Use a Shelf share link instead.";
  }
  if (lower.includes("timed out")) {
    return "Telegram took too long to accept the file. Try a smaller PDF, or share a Shelf link.";
  }
  return "Could not send to Telegram. Try again.";
}

export async function sharePageToTelegram(opts: {
  userId: string;
  pageId: string;
}): Promise<{ kind: "document" | "message"; title: string }> {
  if (!isTelegramConfigured()) {
    throw new TelegramShareError(
      503,
      "Telegram isn’t available right now. Please try again later."
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: { telegramId: true },
  });
  if (!user) {
    throw new TelegramShareError(404, "User not found");
  }
  if (!user.telegramId) {
    throw new TelegramShareError(
      400,
      "Connect Telegram in Settings first, then send the file."
    );
  }

  const access = await findAccessiblePage(opts.userId, opts.pageId);
  if (!access) {
    throw new TelegramShareError(404, "Page not found");
  }

  const { page } = access;
  const href = `${getAppUrl()}${pageHref(
    page.userSubject?.slug,
    page.userTopicGroup?.slug,
    page.slug
  )}`;
  const caption = `${page.title}\nOpen in Shelf: ${href}`.slice(0, 1024);

  const pdfKey = page.pdfKey;
  const isPdf = page.contentType === "PDF" && Boolean(pdfKey);
  if (!isPdf || !pdfKey) {
    try {
      await sendTelegramMessage(
        user.telegramId,
        `${page.title}\n${href}\n\nThis page isn’t a PDF, so I sent the Shelf link.`,
        { throwOnError: true }
      );
    } catch (err) {
      throw new TelegramShareError(502, telegramApiErrorMessage(err));
    }
    return { kind: "message", title: page.title };
  }

  const listedSize = page.fileSizeBytes || 0;
  if (listedSize > TELEGRAM_BOT_MAX_SEND_BYTES) {
    throw new TelegramShareError(
      400,
      "That PDF is over 50 MB (Telegram bot limit). Share a Shelf link instead."
    );
  }

  const { buffer } = await getObjectBuffer(pdfKey);
  if (buffer.length > TELEGRAM_BOT_MAX_SEND_BYTES) {
    throw new TelegramShareError(
      400,
      "That PDF is over 50 MB (Telegram bot limit). Share a Shelf link instead."
    );
  }

  try {
    await sendTelegramDocument({
      chatId: user.telegramId,
      buffer,
      filename: pdfFilenameForTelegram(page.title),
      caption,
    });
  } catch (err) {
    throw new TelegramShareError(502, telegramApiErrorMessage(err));
  }
  return { kind: "document", title: page.title };
}
