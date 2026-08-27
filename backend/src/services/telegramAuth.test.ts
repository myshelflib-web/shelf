import { createHash, createHmac } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import {
  displayNameFromTelegram,
  isTelegramPlaceholderEmail,
  telegramPlaceholderEmail,
  verifyTelegramLogin,
} from "./telegramAuth.js";

const TOKEN = "123456:ABC-DEF";

function signPayload(fields: Record<string, string | number>): Record<string, unknown> {
  const pairs = Object.keys(fields)
    .sort()
    .map((k) => `${k}=${fields[k]}`);
  const secretKey = createHash("sha256").update(TOKEN).digest();
  const hash = createHmac("sha256", secretKey)
    .update(pairs.join("\n"))
    .digest("hex");
  return { ...fields, hash };
}

describe("telegramAuth", () => {
  const prev = process.env.TELEGRAM_BOT_TOKEN;

  afterEach(() => {
    if (prev === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = prev;
  });

  it("builds placeholder emails", () => {
    expect(telegramPlaceholderEmail("42")).toBe("tg_42@telegram.shelf.local");
    expect(isTelegramPlaceholderEmail("tg_1@telegram.shelf.local")).toBe(true);
    expect(isTelegramPlaceholderEmail("a@b.com")).toBe(false);
  });

  it("formats display names", () => {
    expect(
      displayNameFromTelegram({ first_name: "Ada", last_name: "Lovelace" })
    ).toBe("Ada Lovelace");
    expect(displayNameFromTelegram({ first_name: "Ada", username: "ada" })).toBe(
      "Ada"
    );
  });

  it("accepts a fresh signed login payload", () => {
    process.env.TELEGRAM_BOT_TOKEN = TOKEN;
    const auth_date = Math.floor(Date.now() / 1000);
    const raw = signPayload({
      id: 99,
      first_name: "Ada",
      username: "ada",
      auth_date,
    });
    const profile = verifyTelegramLogin(raw);
    expect(profile.telegramId).toBe("99");
    expect(profile.firstName).toBe("Ada");
    expect(profile.username).toBe("ada");
  });

  it("rejects bad hash", () => {
    process.env.TELEGRAM_BOT_TOKEN = TOKEN;
    const auth_date = Math.floor(Date.now() / 1000);
    const raw = signPayload({
      id: 1,
      first_name: "Ada",
      auth_date,
    });
    raw.hash = "0".repeat(64);
    expect(() => verifyTelegramLogin(raw)).toThrow(/signature/i);
  });

  it("rejects stale auth_date", () => {
    process.env.TELEGRAM_BOT_TOKEN = TOKEN;
    const raw = signPayload({
      id: 1,
      first_name: "Ada",
      auth_date: Math.floor(Date.now() / 1000) - 600,
    });
    expect(() => verifyTelegramLogin(raw)).toThrow(/expired/i);
  });
});
