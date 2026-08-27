import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type TelegramLoginPayload = {
  id: number | string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number | string;
  hash: string;
};

export class TelegramAuthError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "TelegramAuthError";
  }
}

const AUTH_MAX_AGE_SEC = 5 * 60;

function botToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    throw new TelegramAuthError(503, "Telegram login is not configured");
  }
  return token;
}

/** Placeholder email for Telegram-only accounts (required unique User.email). */
export function telegramPlaceholderEmail(telegramId: string): string {
  return `tg_${telegramId}@telegram.shelf.local`;
}

export function isTelegramPlaceholderEmail(email: string): boolean {
  return email.endsWith("@telegram.shelf.local");
}

export function displayNameFromTelegram(payload: {
  first_name: string;
  last_name?: string;
  username?: string;
}): string {
  const full = [payload.first_name, payload.last_name]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(" ");
  if (full) return full.slice(0, 80);
  if (payload.username?.trim()) return payload.username.trim().slice(0, 80);
  return "Telegram user";
}

/**
 * Verify Telegram Login Widget payload.
 * @see https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramLogin(
  raw: Record<string, unknown>
): {
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
} {
  const hash = String(raw.hash ?? "");
  if (!/^[a-f0-9]{64}$/i.test(hash)) {
    throw new TelegramAuthError(401, "Invalid Telegram login data");
  }

  const authDate = Number(raw.auth_date);
  if (!Number.isFinite(authDate) || authDate <= 0) {
    throw new TelegramAuthError(401, "Invalid Telegram login data");
  }
  const ageSec = Math.floor(Date.now() / 1000) - authDate;
  if (ageSec > AUTH_MAX_AGE_SEC || ageSec < -60) {
    throw new TelegramAuthError(401, "Telegram login expired. Try again.");
  }

  const id = raw.id;
  if (id === undefined || id === null || String(id).trim() === "") {
    throw new TelegramAuthError(401, "Invalid Telegram login data");
  }
  const firstName = String(raw.first_name ?? "").trim();
  if (!firstName) {
    throw new TelegramAuthError(401, "Invalid Telegram login data");
  }

  const checkPairs: string[] = [];
  for (const key of Object.keys(raw).sort()) {
    if (key === "hash") continue;
    const value = raw[key];
    if (value === undefined || value === null) continue;
    checkPairs.push(`${key}=${value}`);
  }
  const dataCheckString = checkPairs.join("\n");
  const secretKey = createHash("sha256").update(botToken()).digest();
  const computed = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const a = Buffer.from(computed, "hex");
  const b = Buffer.from(hash.toLowerCase(), "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new TelegramAuthError(401, "Invalid Telegram login signature");
  }

  return {
    telegramId: String(id),
    firstName,
    lastName: raw.last_name ? String(raw.last_name) : undefined,
    username: raw.username ? String(raw.username) : undefined,
    photoUrl: raw.photo_url ? String(raw.photo_url) : undefined,
  };
}
