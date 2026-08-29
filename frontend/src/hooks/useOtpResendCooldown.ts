"use client";

import { useCallback, useEffect, useState } from "react";

export const OTP_RESEND_COOLDOWN_SEC = 30;

export function otpResendLabel(sending: boolean, remaining: number): string {
  if (sending) return "Sending…";
  if (remaining > 0) return `Resend code in ${remaining}s`;
  return "Resend code";
}

export function useOtpResendCooldown(seconds = OTP_RESEND_COOLDOWN_SEC) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = window.setTimeout(
      () => setRemaining((s) => Math.max(0, s - 1)),
      1000
    );
    return () => window.clearTimeout(id);
  }, [remaining]);

  const start = useCallback(
    (forSec = seconds) => {
      setRemaining(Math.max(0, Math.ceil(forSec)));
    },
    [seconds]
  );

  const clear = useCallback(() => setRemaining(0), []);

  return { remaining, coolingDown: remaining > 0, start, clear };
}
