import { Router, Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { errorFields, logger } from "../utils/logger.js";
import { toUserFacingError } from "../utils/userFacingError.js";
import {
  downloadTelegramFile,
  isPdfDocument,
  isTelegramConfigured,
  sendTelegramMessage,
  telegramBotUsername,
  titleFromDocument,
  TELEGRAM_BOT_MAX_FILE_BYTES,
  type TelegramUpdate,
} from "../services/telegramBot.js";
import {
  mintTelegramLinkUrl,
  unlinkTelegram,
} from "../services/telegramLink.js";
import {
  ingestTelegramPdf,
  TelegramIngestError,
} from "../services/telegramIngest.js";

const router = Router();

/** Public bot username for the Login Widget (not a secret). */
router.get("/login-widget", (_req: Request, res: Response) => {
  res.json({ botUsername: telegramBotUsername() });
});

function webhookSecretOk(req: Request): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!expected) {
    // Dev convenience: allow when secret unset (local only).
    return process.env.NODE_ENV !== "production";
  }
  const got = req.header("x-telegram-bot-api-secret-token");
  return Boolean(got && got === expected);
}

router.get("/status", authMiddleware, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      telegramId: true,
      telegramUsername: true,
      telegramLinkedAt: true,
    },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    configured: isTelegramConfigured(),
    botUsername: telegramBotUsername(),
    linked: Boolean(user.telegramId),
    telegramUsername: user.telegramUsername,
    linkedAt: user.telegramLinkedAt,
  });
});

router.post("/link", authMiddleware, async (req: Request, res: Response) => {
  if (!isTelegramConfigured()) {
    res.status(503).json({
      error: toUserFacingError(
        "Telegram is not configured",
        "Telegram isn’t available right now. Please try again later."
      ),
    });
    return;
  }
  try {
    const { url, expiresAt } = await mintTelegramLinkUrl(req.user!.userId);
    res.json({ url, expiresAt });
  } catch (err) {
    req.log?.error("telegram.link_failed", errorFields(err));
    res.status(500).json({ error: "Could not create Telegram link" });
  }
});

router.delete("/link", authMiddleware, async (req: Request, res: Response) => {
  try {
    await unlinkTelegram(req.user!.userId);
    res.json({ ok: true });
  } catch (err) {
    req.log?.error("telegram.unlink_failed", errorFields(err));
    res.status(500).json({ error: "Could not unlink Telegram" });
  }
});

async function handleStart(
  chatId: number,
  telegramUserId: string,
  username: string | undefined,
  payload: string
) {
  const code = payload.trim();
  if (!code) {
    const linked = await prisma.user.findFirst({
      where: { telegramId: telegramUserId },
      select: { id: true },
    });
    if (linked) {
      await sendTelegramMessage(
        chatId,
        "Your Telegram is linked to Shelf. Forward a PDF here to save it to My Content."
      );
      return;
    }
    await sendTelegramMessage(
      chatId,
      "Link your Shelf account first:\n1. Open Shelf → Settings → Connect Telegram\n— or —\n2. Sign in with Telegram on the Shelf login page."
    );
    return;
  }

  const user = await prisma.user.findFirst({
    where: {
      telegramLinkCode: code,
      telegramLinkExpiresAt: { gt: new Date() },
    },
    select: { id: true, telegramId: true },
  });

  if (!user) {
    await sendTelegramMessage(
      chatId,
      "That link expired or is invalid. Open Shelf → Settings → Connect Telegram and try again."
    );
    return;
  }

  const taken = await prisma.user.findFirst({
    where: {
      telegramId: telegramUserId,
      NOT: { id: user.id },
    },
    select: { id: true },
  });
  if (taken) {
    await sendTelegramMessage(
      chatId,
      "This Telegram account is already linked to another Shelf user. Unlink it there first."
    );
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      telegramId: telegramUserId,
      telegramUsername: username ?? null,
      telegramLinkedAt: new Date(),
      telegramLinkCode: null,
      telegramLinkExpiresAt: null,
    },
  });

  await sendTelegramMessage(
    chatId,
    "Linked. Forward or send a PDF here and I’ll save it to your Shelf library (My Content)."
  );
}

async function handleDocument(
  chatId: number,
  telegramUserId: string,
  doc: NonNullable<TelegramUpdate["message"]>["document"]
) {
  if (!doc) return;

  const user = await prisma.user.findFirst({
    where: { telegramId: telegramUserId },
    select: { id: true },
  });
  if (!user) {
    await sendTelegramMessage(
      chatId,
      "Telegram isn’t linked to Shelf yet. Open Settings → Connect Telegram, or sign in with Telegram on the web."
    );
    return;
  }

  if (!isPdfDocument(doc)) {
    await sendTelegramMessage(
      chatId,
      "I only save PDF files for now. Send or forward a .pdf."
    );
    return;
  }

  if (doc.file_size != null && doc.file_size > TELEGRAM_BOT_MAX_FILE_BYTES) {
    await sendTelegramMessage(
      chatId,
      "That PDF is over 20 MB (Telegram bot limit). Upload it in Shelf instead."
    );
    return;
  }

  try {
    const { buffer } = await downloadTelegramFile(doc.file_id);
    const title = titleFromDocument(doc);
    const saved = await ingestTelegramPdf({
      userId: user.id,
      title,
      buffer,
    });
    await sendTelegramMessage(
      chatId,
      `Saved “${saved.title}” to My Content.\nOpen: ${saved.href}`
    );
  } catch (err) {
    if (err instanceof TelegramIngestError) {
      await sendTelegramMessage(chatId, err.userMessage);
      return;
    }
    logger.error("telegram.ingest_failed", errorFields(err));
    await sendTelegramMessage(
      chatId,
      "Could not save that PDF. Try again, or upload it in Shelf."
    );
  }
}

router.post("/webhook", async (req: Request, res: Response) => {
  if (!webhookSecretOk(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  // Always 200 quickly so Telegram does not retry aggressively.
  res.json({ ok: true });

  const update = req.body as TelegramUpdate;
  const message = update?.message;
  if (!message?.from || message.from.is_bot) return;

  const chatId = message.chat.id;
  const telegramUserId = String(message.from.id);
  const username = message.from.username;

  try {
    if (message.text?.startsWith("/start")) {
      const payload = message.text.slice("/start".length).trim();
      await handleStart(chatId, telegramUserId, username, payload);
      return;
    }

    if (message.document) {
      await handleDocument(chatId, telegramUserId, message.document);
      return;
    }

    if (message.text) {
      await sendTelegramMessage(
        chatId,
        "Send or forward a PDF to save it to Shelf. Use /start after linking from Settings."
      );
    }
  } catch (err) {
    logger.error("telegram.webhook_handler_failed", errorFields(err));
  }
});

export default router;
