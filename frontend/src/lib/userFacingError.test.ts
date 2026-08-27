import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("toUserFacingError", () => {
  it("passes through normal errors in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { toUserFacingError } = await import("./userFacingError");
    expect(toUserFacingError("Email already registered")).toBe(
      "Email already registered"
    );
  });

  it("hides env setup hints in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { toUserFacingError } = await import("./userFacingError");
    expect(
      toUserFacingError(
        "Set NEXT_PUBLIC_TELEGRAM_BOT_USERNAME (and backend TELEGRAM_BOT_TOKEN)"
      )
    ).toBe("Telegram isn’t available right now. Please try again later.");
    expect(
      toUserFacingError(
        "Payments not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
      )
    ).toBe("Payments aren’t available right now. Please try again later.");
  });

  it("keeps dev hints in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { toUserFacingError } = await import("./userFacingError");
    const raw = "Set GOOGLE_CLIENT_ID on Vercel";
    expect(toUserFacingError(raw)).toBe(raw);
  });
});
