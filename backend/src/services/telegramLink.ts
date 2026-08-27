import { randomBytes } from "node:crypto";
import prisma from "../utils/prisma.js";
import { telegramBotUsername } from "./telegramBot.js";

const LINK_TTL_MS = 10 * 60 * 1000;

export function generateTelegramLinkCode(): string {
  return randomBytes(16).toString("hex");
}

export async function mintTelegramLinkUrl(userId: string): Promise<{
  url: string;
  expiresAt: Date;
}> {
  const username = telegramBotUsername();
  if (!username) {
    throw new Error("TELEGRAM_BOT_USERNAME is not set");
  }

  const code = generateTelegramLinkCode();
  const expiresAt = new Date(Date.now() + LINK_TTL_MS);

  await prisma.user.update({
    where: { id: userId },
    data: {
      telegramLinkCode: code,
      telegramLinkExpiresAt: expiresAt,
    },
  });

  return {
    url: `https://t.me/${username}?start=${code}`,
    expiresAt,
  };
}

export async function clearTelegramLinkCode(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      telegramLinkCode: null,
      telegramLinkExpiresAt: null,
    },
  });
}

export async function unlinkTelegram(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      telegramId: null,
      telegramUsername: null,
      telegramLinkedAt: null,
      telegramLinkCode: null,
      telegramLinkExpiresAt: null,
    },
  });
}
