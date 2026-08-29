import { describe, expect, it } from "vitest";
import { generateOtpCode, normalizeEmail, OtpCooldownError } from "./otp.js";

describe("email otp helpers", () => {
  it("normalizes email to lowercase trimmed", () => {
    expect(normalizeEmail("  User@Example.COM ")).toBe("user@example.com");
  });

  it("generates 6-digit codes", () => {
    for (let i = 0; i < 20; i++) {
      const code = generateOtpCode();
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it("cooldown error includes remaining seconds", () => {
    const err = new OtpCooldownError(17);
    expect(err.retryAfterSec).toBe(17);
    expect(err.message).toBe("Please wait 17s before requesting another code");
  });
});
