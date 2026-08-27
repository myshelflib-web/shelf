import { describe, expect, it } from "vitest";
import { isTelegramWidgetError } from "./telegramLoginWidget";

describe("isTelegramWidgetError", () => {
  it("detects bot domain invalid", () => {
    expect(isTelegramWidgetError("Bot domain invalid")).toBe(true);
  });

  it("ignores normal copy", () => {
    expect(isTelegramWidgetError("Continue with Telegram")).toBe(false);
  });
});
