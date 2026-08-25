"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Register on production builds (Vercel) — required for Chrome install prompt.
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Non-fatal: iOS can still Add to Home Screen without a service worker.
    });
  }, []);

  return null;
}
