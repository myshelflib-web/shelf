import { describe, expect, it } from "vitest";
import { generateOtpCode, normalizeEmail } from "./otp.js";

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
});
