import { describe, expect, it } from "vitest";
import { otpResendLabel } from "./useOtpResendCooldown";

describe("otpResendLabel", () => {
  it("shows sending, countdown, then resend", () => {
    expect(otpResendLabel(true, 12)).toBe("Sending…");
    expect(otpResendLabel(false, 30)).toBe("Resend code in 30s");
    expect(otpResendLabel(false, 0)).toBe("Resend code");
  });
});
