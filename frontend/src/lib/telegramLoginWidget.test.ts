import { describe, expect, it, vi } from "vitest";
import {
  isTelegramLoginHostAllowed,
  isTelegramWidgetError,
} from "./telegramLoginWidget";

describe("isTelegramWidgetError", () => {
  it("detects bot domain invalid", () => {
    expect(isTelegramWidgetError("Bot domain invalid")).toBe(true);
  });

  it("ignores normal copy", () => {
    expect(isTelegramWidgetError("Continue with Telegram")).toBe(false);
  });
});

describe("isTelegramLoginHostAllowed", () => {
  it("allows any host when allowlist is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_TELEGRAM_LOGIN_HOSTS", "");
    expect(isTelegramLoginHostAllowed()).toBe(true);
    vi.unstubAllEnvs();
  });
});
