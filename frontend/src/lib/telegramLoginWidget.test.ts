import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isHostnameAllowedForTelegramLogin,
  isTelegramLoginHostAllowed,
  isTelegramWidgetError,
  normalizeTelegramBotUsername,
} from "./telegramLoginWidget";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isTelegramWidgetError", () => {
  it("detects bot domain invalid", () => {
    expect(isTelegramWidgetError("Bot domain invalid")).toBe(true);
  });

  it("ignores normal copy", () => {
    expect(isTelegramWidgetError("Continue with Telegram")).toBe(false);
  });
});

describe("normalizeTelegramBotUsername", () => {
  it("strips @ and rejects placeholders", () => {
    expect(normalizeTelegramBotUsername("@ShelfStudyBot")).toBe("ShelfStudyBot");
    expect(normalizeTelegramBotUsername("  ShelfStudyBot  ")).toBe(
      "ShelfStudyBot"
    );
    expect(normalizeTelegramBotUsername("your-telegram-bot")).toBe(null);
    expect(normalizeTelegramBotUsername("")).toBe(null);
    expect(normalizeTelegramBotUsername(null)).toBe(null);
  });
});

describe("isTelegramLoginHostAllowed", () => {
  it("allows any host when allowlist is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_LOGIN_HOSTS", "");
    expect(isTelegramLoginHostAllowed()).toBe(true);
  });

  it("treats localhost and 127.0.0.1 as aliases", () => {
    expect(
      isHostnameAllowedForTelegramLogin("127.0.0.1", "localhost")
    ).toBe(true);
    expect(
      isHostnameAllowedForTelegramLogin("localhost", "127.0.0.1")
    ).toBe(true);
    expect(
      isHostnameAllowedForTelegramLogin("myshelflib.com", "localhost")
    ).toBe(false);
  });
});
